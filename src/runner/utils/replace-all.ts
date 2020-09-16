// https://stackoverflow.com/a/6714233/5365075
// export function replaceAll(str: string, textToReplace: string, replaceWidth: string, caseSensitive = false): string {
//   return str.replace(
//     new RegExp(
//       textToReplace.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"),
//       caseSensitive ? "gi" : "g",
//     ),
//     typeof replaceWidth == "string"
//       ? replaceWidth.replace(/\$/g, "$$$$")
//       : replaceWidth
//   );
// }

export function replaceAll(
  str: string,
  textToReplace: string,
  replaceWith: string,
): string {
  return str.split(textToReplace).join(replaceWith);
}
