import { create } from "./create";
import { deletePart } from "./delete";
import { list } from "./list";
import { requestUpload } from "./request-upload";

export const partRouter = {
  list,
  requestUpload,
  create,
  // `delete` is a reserved word — aliased from deletePart
  delete: deletePart,
};
