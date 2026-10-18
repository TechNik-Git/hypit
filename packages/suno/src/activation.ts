import { sunoComponent, sunoHostFacet, sunoManifest } from "./index.js";

export const hypitPackage = {
  format: "hypit.node-package@1" as const,
  modules: [{ manifest: sunoManifest }],
  components: [sunoComponent],
  hostFacets: [sunoHostFacet],
};
export default hypitPackage;
