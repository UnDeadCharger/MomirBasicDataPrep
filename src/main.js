//Get the DOM elements
const debugContent = document.getElementById("debug-content");
const startDownloadButton = document.getElementById("start-download");
const selectPathButton = document.getElementById("select-path");

let targetedWritable = null;

async function getBulkData() {
  const data = await fetch("https://api.scryfall.com/bulk-data/oracle_cards");
  console.log(data);
  const downloadURI = (await data.json()).download_uri;
  const downloadData = await fetch(downloadURI);
  let jsonData = await downloadData.json();
  console.log("file size", new Blob([JSON.stringify(jsonData)]).size);

  let newIndex = 0;
  for (let i = 0; i < jsonData.length; i++) {
    // Basic Check
    if (!jsonData[i].type_line.includes("Creature")) continue;
    if (!jsonData[i].games.includes("paper")) continue;
    if (jsonData[i].content_warning) continue;
    if (jsonData[i].set_type === "funny") continue;
    if (jsonData[i].layout === "token") continue;
    if (jsonData[i].card_faces) continue;

    jsonData[newIndex] = {
      name: jsonData[i].name,
      mana_cost: jsonData[i].mana_cost,
      type_line: jsonData[i].type_line,
      oracle_text: jsonData[i].oracle_text,
      power: jsonData[i].power,
      toughness: jsonData[i].toughness,
      image_uri: jsonData[i].image_uris?.art_crop || null,
    };
    newIndex++;
  }

  console.log(newIndex);
  jsonData = jsonData.slice(0, newIndex);
  console.log(jsonData[0]);
  console.log("file size", new Blob([JSON.stringify(jsonData)]).size);
  if (targetedWritable) {
    console.log("writing to file...");
    await targetedWritable.write(JSON.stringify(jsonData));
    await targetedWritable.close();
    console.log("file written successfully");
  }
}

async function selectPath() {
  const dirHandle = await window.showDirectoryPicker({
    id: "sd-picker",
    mode: "readwrite",
  });
  const fileHandle = await dirHandle.getFileHandle("cards.json", {
    create: true,
  });
  const writable = await fileHandle.createWritable();

  targetedWritable = writable;
  console.log(targetedWritable);
}

startDownloadButton.onclick = getBulkData;
selectPathButton.onclick = selectPath;
