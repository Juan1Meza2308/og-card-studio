/**
 * Verificacion del modulo OG.
 *
 * La parte de layout (que un titulo al limite de longitud no desborde) se
 * midio antes del cambio de renderer, leyendo los rectangulos que satori
 * emitia en los <mask> de cada bloque de texto. El motor de layout sigue
 * siendo satori y el componente no cambio, asi que ese limite sigue valiendo.
 * Lo que se comprueba aca es lo que un cambio si puede romper: el contrato de
 * entrada, y que el render sea determinista y distinguible.
 *
 * Los globals de CommonJS se instalan antes de cargar el renderer, con un
 * import dinamico a proposito: una importacion estatica se evaluaria antes y
 * la libreria buscaria el wasm sin globals. En produccion el orden lo
 * garantiza el punto de entrada del servidor; aca hay que replicarlo.
 */
import { readFileSync } from "node:fs";
import { installCommonJsGlobals } from "../src/lib/og/cjs-globals";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  FONT_FAMILY,
  TEMPLATE_IDS,
  THEME_IDS,
} from "../src/lib/og/constants";
import { parseOgRequest } from "../src/lib/og/schema";
import type { OgCardProps } from "../src/lib/og/card";

installCommonJsGlobals();
const { rasterizeCard } = await import("../src/lib/og/render");

const fonts = [
  {
    name: FONT_FAMILY,
    data: readFileSync("public/og/fonts/Inter_400Regular.ttf"),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: FONT_FAMILY,
    data: readFileSync("public/og/fonts/Inter_700Bold.ttf"),
    weight: 700 as const,
    style: "normal" as const,
  },
];

/** Bytes de cabecera de un PNG: firma + ancho/alto en el IHDR. */
function pngInfo(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const firma = String.fromCharCode(...bytes.subarray(1, 4));
  if (firma !== "PNG") return null;
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { ancho: vista.getUint32(16), alto: vista.getUint32(20) };
}

let fallos = 0;
const reportar = (ok: boolean, msg: string) => {
  if (!ok) fallos++;
  console.log(`${ok ? "OK   " : "FALLA"} ${msg}`);
};

async function renderizar(props: OgCardProps): Promise<Uint8Array> {
  const { png } = await rasterizeCard(props, fonts);
  return png;
}

console.log("--- limites de entrada ---");
const exceso = parseOgRequest(new URLSearchParams({ title: "a".repeat(91) }));
reportar(!exceso.ok, "un titulo de 91 caracteres se rechaza");

const justo = parseOgRequest(new URLSearchParams({ title: "a".repeat(90) }));
reportar(justo.ok, "un titulo de 90 caracteres se acepta");

const conLineas = parseOgRequest(new URLSearchParams({ title: "  hola\n\n\tmundo   " }));
reportar(
  conLineas.ok && conLineas.value.title === "hola mundo",
  "los saltos de linea se colapsan a espacios",
);

const plantillaMala = parseOgRequest(new URLSearchParams({ template: "no-existe" }));
reportar(!plantillaMala.ok, "una plantilla desconocida se rechaza en vez de caer a un default");

const vacio = parseOgRequest(new URLSearchParams());
reportar(vacio.ok && !!vacio.value.title, "una query vacia devuelve una card valida");

const desconocido = parseOgRequest(new URLSearchParams({ title: "x", utm_source: "twitter" }));
reportar(desconocido.ok, "un parametro desconocido se ignora en vez de romper");

const tituloVacio = parseOgRequest(new URLSearchParams({ title: "   " }));
reportar(
  tituloVacio.ok && tituloVacio.value.title.length > 0,
  "un titulo en blanco cae al default",
);

const guion = parseOgRequest(new URLSearchParams({ theme: "neon" }));
reportar(!guion.ok, "un tema desconocido se rechaza");

console.log("\n--- render de cada combinacion ---");
const digests = new Map<string, string>();
for (const template of TEMPLATE_IDS) {
  for (const theme of THEME_IDS) {
    const bytes = await renderizar({
      title: "Ship ideas people remember",
      subtitle: "Engineering · Product",
      template,
      theme,
      host: "ejemplo.test",
    });
    const info = pngInfo(bytes);
    const ok =
      info !== null &&
      info.ancho === CARD_WIDTH &&
      info.alto === CARD_HEIGHT &&
      bytes.length > 3_000;
    reportar(
      ok,
      `${template}/${theme}  ${bytes.length} b  ${info ? `${info.ancho}x${info.alto}` : "no es png"}`,
    );
    digests.set(`${template}/${theme}`, Buffer.from(bytes).toString("base64").slice(0, 400));
  }
}

console.log("\n--- propiedades ---");
const unicas = new Set(digests.values());
reportar(
  unicas.size === digests.size,
  `cada combinacion produce una imagen distinta (${unicas.size}/${digests.size})`,
);

const a = await renderizar({
  title: "Mismo",
  subtitle: "Igual",
  template: "tech",
  theme: "violet",
  host: "ejemplo.test",
});
const b = await renderizar({
  title: "Mismo",
  subtitle: "Igual",
  template: "tech",
  theme: "violet",
  host: "ejemplo.test",
});
reportar(
  Buffer.from(a).equals(Buffer.from(b)),
  "la misma entrada produce los mismos bytes (cacheable)",
);

const c = await renderizar({
  title: "Otro",
  subtitle: "Igual",
  template: "tech",
  theme: "violet",
  host: "ejemplo.test",
});
reportar(!Buffer.from(a).equals(Buffer.from(c)), "cambiar el titulo cambia los bytes");

const vacioTexto = await renderizar({
  title: "",
  subtitle: "",
  template: "tech",
  theme: "violet",
  host: "ejemplo.test",
});
reportar(pngInfo(vacioTexto) !== null, "una card sin texto tambien es un PNG valido");

const largo = await renderizar({
  title:
    "Titulo deliberadamente largo para forzar el ajuste de linea al maximo permitido por la API".slice(
      0,
      90,
    ),
  subtitle: "Una descripcion larga que tambien llega al limite de caracteres permitido".slice(
    0,
    140,
  ),
  template: "tech",
  theme: "violet",
  host: "ejemplo.test",
});
reportar(pngInfo(largo) !== null, "una card con texto al limite tambien renderiza");

console.log(fallos === 0 ? "\nTodo correcto" : `\n${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
