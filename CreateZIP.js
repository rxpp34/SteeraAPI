const AdmZip = require("adm-zip");
const editJsonFile = require("edit-json-file");


function createZipArchive(ClientID,ServerBadge) {
  try{
      let file = editJsonFile("./AztekServiceManager/Metadata.json");
      file.set("Badge",ServerBadge)
      file.set("Client",ClientID)
      file.save();
      const zip = new AdmZip();
      const outputFile = "./AztekServiceManager.zip";
      zip.addLocalFolder("./AztekServiceManager");
      zip.writeZip(outputFile);
  }
  catch(e)
  {
    console.log(`Something went wrong. ${e}`);
  }
}

createZipArchive()

module.exports={createZipArchive}