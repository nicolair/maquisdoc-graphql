const { makeAugmentedSchema } = require("neo4j-graphql-js")
const {ApolloServer} = require("apollo-server")
const neo4j = require("neo4j-driver")

const typeDefs = /* GraphQL */ `
type Document {
    _id: ID!
    titre: String
    typeDoc: String
    description: String
    url: String
    urlSrc: String
    urlEnon: String
    urlCorr: String
    urlSrcEnon: String
    urlSrcCorr: String
    concepts: [Concept] @relation(name: "DOCUMENTE", direction: OUT)
    evenements: [Evenement] @relation(name: "UTILISE", direction: IN)
}

type DocumentVoisin {
    typeRel: String
    out: Boolean
    docType: String
    docTitre: String
    docDescription: String
    docUrl: String
    docId: ID!
}

type ConceptVoisin{
    typeRel: String
    out: Boolean
    conceptLitteral: String
    conceptDescription: String
    conceptId: ID!
}

type Concept {
    litteral: String
    discipline : String
    description: String
    _id: ID!
    documents: [Document] @relation(name: "DOCUMENTE", direction: IN)
    listexos: [Document] @cypher(statement: """
      MATCH (f {typeDoc: "liste exercices"})-[:EVALUE]->(this)
      RETURN f
    """)
    documentsvoisins: [DocumentVoisin] @cypher(statement: """ 
      MATCH (this:Concept)-[r]-(d:Document)
      WITH {
           typeRel: type(r) ,
           out: id(endNode(r))=id(d) ,
           docType : d.typeDoc ,
           docTitre: d.titre ,
           docDescription: d.description,
           docUrl: d.url,
           docId: id(d)
      } AS DocumentVoisin
      RETURN DocumentVoisin
    """)
    conceptsvoisins: [ConceptVoisin] @cypher(statement: """ 
      MATCH (this:Concept)-[r]-(c:Concept)
      WITH {
           typeRel: type(r) ,
           out: id(endNode(r))=id(c) ,
           conceptLitteral : c.litteral ,
           conceptDescription: c.description,
           conceptId: id(c)
      } AS ConceptVoisin
      RETURN ConceptVoisin
    """)
}

type Evenement {
    nom: String 
    typeEvt: String
    concepts: [Concept] @relation(name: "EVALUE", direction: OUT)
    documents: [Document] @relation(name: "UTILISE", direction: OUT)
    sousevenements: [Evenement] @relation(name: "CONTIENT", direction: OUT)
}

type Query {
  coursdocuments : [Document] @cypher(statement: """
    MATCH (d:Document {typeDoc:"cours"})
    RETURN d
  """),
  problemedocuments : [Document] @cypher(statement: """
    MATCH (d:Document {typeDoc:"problème"})
    RETURN d
  """),
  semaines : [Evenement] @cypher(statement: """
    MATCH (s:Evenement {typeEvt:"semaine de colle"})
    RETURN s
  """),
  searchpbs (mot:String): [Document] @cypher(statement: """
    CALL db.index.fulltext.queryNodes("TitresEtDescriptions", $mot)
      YIELD node, score
    WHERE node.typeDoc = "problème"
    RETURN  node
  """),
  searchcours (mot:String): [Document] @cypher(statement: """
    CALL db.index.fulltext.queryNodes("TitresEtDescriptions", $mot)
      YIELD node, score
    WHERE node.typeDoc = "cours"
    RETURN  node
  """),
  searchconcepts (mot:String): [Concept] @cypher(statement: """
    CALL db.index.fulltext.queryNodes("LittérauxEtDescriptions", $mot)
      YIELD node
    RETURN  node
  """)
}
`

const schema = makeAugmentedSchema({typeDefs})

const neo4j_url = process.env.NEO4J_URL || "bolt://localhost:7687"

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
