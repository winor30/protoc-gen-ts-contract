import type { DescFile, DescMessage } from "@bufbuild/protobuf";

const PROTO_SUFFIX = /\.proto$/;

export function generateContractFileName(file: DescFile): string {
  const sourceName = file.proto.name;
  const tsName = sourceName.replace(PROTO_SUFFIX, "_contract.ts");
  if (tsName.includes("..")) {
    throw new Error(
      `refusing to generate contract outside package boundary: ${tsName}`
    );
  }
  return tsName;
}

export function inputTypeName(message: DescMessage): string {
  // Match protobuf-es identifier strategy:
  // drop package and replace nested type `.` with `_`.
  // See https://github.com/bufbuild/protobuf-es/blob/main/packages/protoplugin/src/names.ts#L170-L177
  const pkg = message.file.proto.package;
  const offset = pkg.length > 0 ? pkg.length + 1 : 0;
  const nameWithoutPackage = message.typeName.substring(offset);
  return `${nameWithoutPackage.replace(/\./g, "_")}Input`;
}
