const editJsonFile = require("edit-json-file");

function CreateConfig(ClientID,ServerBadge)
{
    let file = editJsonFile("./Metadata.json");
      file.set("Badge",ServerBadge)
      file.set("Client",ClientID)
      file.save();
}


module.exports={CreateConfig}