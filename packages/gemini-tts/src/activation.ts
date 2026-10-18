import { geminiTtsComponent, geminiTtsHostFacet, geminiTtsManifest } from "./index.js";

export const hypitPackage = {
  format: "hypit.node-package@1" as const,
  modules: [{ manifest: geminiTtsManifest }],
  components: [geminiTtsComponent],
  hostFacets: [geminiTtsHostFacet],
};
export default hypitPackage;
