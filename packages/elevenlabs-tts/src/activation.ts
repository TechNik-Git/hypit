import {
  elevenLabsTtsComponent, elevenLabsTtsHostFacet, elevenLabsTtsManifest,
} from "./index.js";

export const hypitPackage = {
  format: "hypit.node-package@1" as const,
  modules: [{ manifest: elevenLabsTtsManifest }],
  components: [elevenLabsTtsComponent],
  hostFacets: [elevenLabsTtsHostFacet],
};
export default hypitPackage;
