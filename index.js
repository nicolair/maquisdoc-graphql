const { makeAugmentedSchema } = require("neo4j-graphql-js")
const {ApolloServer} = require("apollo-server")
const neo4j = require("neo4j-driver")

const typeDefs = /* GraphQL */ `
type Document {
    titre: String
    typeDoc: String
    url: String
    urlEnon: String
    urlCorr: String
    urlSrcEnon: String
    urlSrcCorr: String
    concepts: [Concept] @relation(name: "DOCUMENTE", direction: "OUT")
    evenements: [Evenement] @relation(name: "UTILISE", direction: "IN")
}

type Concept {
    litteral: String
    discipline : String
    description: String
    documents: [Document] @relation(name: "DOCUMENTE", direction: "IN")
    evenements: [Evenement] @relation(name: "EVALUE", direction: "IN")
    listexos: [Document] @cypher(statement: """
      MATCH (f {typeDoc: "liste exercices"})-[:EVALUE]->(this)
      RETURN f
    """)
}

type Evenement {
    nom: String 
    typeEvt: String
    concepts: [Concept] @relation(name: "EVALUE", direction: "OUT")
    documents: [Document] @relation(name: "UTILISE", direction: "OUT")
    sousevenements: [Evenement] @relation(name: "CONTIENT", direction: "OUT")
}

type Query {
  alldocuments : [Document] @cypher(statement: """
    MATCH (d:Document {typeDoc:"cours"})
    RETURN d
  """),
  semaines : [Evenement] @cypher(statement: """
    MATCH (s:Evenement {typeEvt:"semaine de colle"})
    RETURN s
  """),
  semaineParNom(nomS: String!) : Evenement @cypher(statement: """
    MATCH (s:Evenement 
        {
          typeEvt:"semaine de colle", 
          nom : $nomS
        }
    )
    RETURN s
  """),
}
`

const schema = makeAugmentedSchema({typeDefs})

//const neo4j_url = process.env.NEO4J_URL
const neo4j_url = "bolt://188.226.151.10:7687"
const neo4j_pw = process.env.NEO4J_PASSWORD
const neo4j_username = process.env.NEO4J_USERNAME
const driver = neo4j.driver(
    neo4j_url,
    neo4j.auth.basic(neo4j_username,neo4j_pw)
);

const server = new ApolloServer({schema, context: {driver}})

server.listen(3003,"0.0.0.0")
    .then(({ url }) => {
    console.log(`GraphQL ready at ${url}`);
});
