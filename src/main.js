//Get the DOM elements
const debugContent = document.getElementById("debug-content");
const startDownloadButton = document.getElementById("start-download");
const selectPathButton = document.getElementById("select-path");

let dirHandle = null;
let mappedDir = {};

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
      cmc: jsonData[i].cmc,
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
  if (dirHandle) {
    try {
      console.log("writing to file...");
      console.time();
      for (const card of jsonData) {
        const cmc = card.cmc;
        const subDir = await getSubDirectoryHandle(cmc, dirHandle);
        await writeToFile(subDir, card);
      }
      console.log("file written successfully");
      console.timeLog();
      console.timeEnd();
    } catch (e) {
      console.error("FAILL", e);
    }
  }
}

async function getSubDirectoryHandle(manaValue, dirHandle) {
  if (!mappedDir[manaValue]) {
    mappedDir[manaValue] = await dirHandle.getDirectoryHandle(manaValue, {
      create: true,
    });
  }
  return mappedDir[manaValue];
}

async function writeToFile(dirHandle, cardData) {
  try {
    const safeName = cardData.name.replace(/[<>:"/\\|?*]/g, "_");
    const fileHandle = await dirHandle.getFileHandle(`${safeName}.json`, {
      create: true,
    });

    const writable = await fileHandle.createWritable();

    writable.write(JSON.stringify(cardData));
    writable.close();
  } catch (e) {
    console.log("FAIL", e, cardData);
  }
}

async function selectPath() {
  dirHandle = await window.showDirectoryPicker({
    id: "sd-picker",
    mode: "readwrite",
  });
}

startDownloadButton.onclick = getBulkData;
selectPathButton.onclick = selectPath;
