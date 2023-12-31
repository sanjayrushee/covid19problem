const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const ConvertStateObjectToResponseObject = (dbobject) => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  };
};

const ConvertDistrictObjectToResponseObject = (dbobject) => {
  return {
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getstates = `
    SELECT *
    FROM
    state;
    `;
  const statesArray = await database.all(getstates);
  response.send(
    statesArray.map((eachstate) =>
      ConvertStateObjectToResponseObject(eachstate)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id =${stateId};`;
  const state = await database.get(getStateIdQuery);
  response.send(ConvertStateObjectToResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const PostDistricts = `
    INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await database.run(PostDistricts);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictIdQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    district_id =${districtId};`;
  const district = await database.get(getdistrictIdQuery);
  response.send(ConvertDistrictObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedistrict = `
    DELETE FROM
    FROM
    district
    WHERE
    district_id =${districtId};`;
  const district = await database.get(deletedistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const UpdataDistricts = `
            UPDATE 
            district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`;
  await database.run(UpdataDistricts);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM
    district
    WHERE
    state_id = ${stateId};
    `;
  const stats = await database.get(getTotalQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictId = `
    SELECT state_id FROM district
    WHERE district_id =${districtId};
    `;
  const getDistrictIdQuery = await database.get(getDistrictId);

  const getstateNameQuery = `
    SELECT state_name as stateName
    FROM
    state
    WHERE 
    state_id = ${getDistrictIdQuery.state_id};`;

  const getSateNameQueryResponse = await database.get(getstateNameQuery);
  response.send(getSateNameQueryResponse);
});

module.exports = app;
