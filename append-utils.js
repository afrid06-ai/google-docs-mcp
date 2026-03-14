/**
 * Insert content at TOP with black background + white text on the TEXT itself.
 * Not a table - when you delete the text, the black background goes with it.
 */
const INSERT_INDEX = 1;

export async function insertBlockAtTop(docs, docId, content) {
  const textToInsert = content.endsWith("\n") ? content : content + "\n";
  const insertEnd = INSERT_INDEX + textToInsert.length;

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: INSERT_INDEX, segmentId: "" },
            text: textToInsert,
          },
        },
        {
          updateTextStyle: {
            range: {
              startIndex: INSERT_INDEX,
              endIndex: insertEnd,
              segmentId: "",
            },
            textStyle: {
              backgroundColor: {
                color: { rgbColor: { red: 0, green: 0, blue: 0 } },
              },
              foregroundColor: {
                color: { rgbColor: { red: 1, green: 1, blue: 1 } },
              },
            },
            fields: "backgroundColor,foregroundColor",
          },
        },
      ],
    },
  });
}
