// Get Cosmos Client
const CosmosClient = require("@azure/cosmos").CosmosClient;

const config = require('../config.json');

// Provide required connection from config file
const consmosdb_connection_string = config[0].consmosdb_connection_string;
// Set Database name and container name with unique timestamp
const databaseName = `AICallCenterDB`;
const containerName = `AI_Item`;

async function writeData(data, prompt, response, reqinfo){
    try{
        //console.log("Writing Data: ",data, "\n prompt:", prompt, "\n response: ", response);
        // Connect to Azure Cosmos DB  
        const cosmosdbClient = new CosmosClient(consmosdb_connection_string)
        const database = cosmosdbClient.database(databaseName);
        const container = database.container(containerName);
 
        const currentDate = new Date();
        const formattedDateTime = currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');

        const newItem =
        {
            "data": data,
            "prompt": prompt,
            "response": response,
            "request_time": formattedDateTime,
            "request_info": reqinfo
        }
        const { resource: createdItem } = await container.items.create(newItem);
        console.log(`\r\nCreated new item: ${createdItem.id} \r\n`);
    } catch(error){
        console.error('Error writing to the database:', error);
    }
    

}

async function updateData(data, prompt, response){
    console.log("Updating Data: ",+ data, "\n prompt:", + prompt, "\n response: ", + response);

}

module.exports = {writeData, updateData};