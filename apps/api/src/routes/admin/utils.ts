import { v1 } from "@authzed/authzed-node";
import { Metadata } from "@grpc/grpc-js";
import { spicedbClient } from "../../authz/client";

export function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token =
    process.env.SPICEDB_GRPC_PRESHARED_KEY || process.env.SPICEDB_GRPC_TOKEN;
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

export async function writeRelationship(
  namespace: string,
  objectId: string,
  relation: string,
  subjectId: string,
): Promise<void> {
  try {
    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.CREATE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({
          objectType: namespace,
          objectId,
        }),
        relation,
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({
            objectType: "user",
            objectId: subjectId,
          }),
        }),
      }),
    });

    const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
    await spicedbClient.promises.writeRelationships(req, md);
  } catch (error) {
    console.error("SpiceDB write error:", error);
    throw error;
  }
}

export async function deleteResourceRelationships(
  namespace: string,
  objectId: string
): Promise<void> {
  try {
    const md = makeAuthMetadata();
    
    // 1. Supprimer où l'objet est la RESSOURCE (ex: qui a accès à ce Jeu)
    await spicedbClient.promises.deleteRelationships(v1.DeleteRelationshipsRequest.create({
      relationshipFilter: v1.RelationshipFilter.create({
        resourceType: namespace,
        optionalResourceId: objectId
      })
    }), md);

    // 2. Supprimer où l'objet est le SUJET (ex: ce Studio est le parent d'un Jeu)
    await spicedbClient.promises.deleteRelationships(v1.DeleteRelationshipsRequest.create({
      relationshipFilter: v1.RelationshipFilter.create({
        optionalSubjectFilter: v1.SubjectFilter.create({
          subjectType: namespace,
          optionalSubjectId: objectId
        })
      })
    }), md);

    console.log(`[SpiceDB] Nettoyage complet pour ${namespace}:${objectId}`);
  } catch (error) {
    console.error(`SpiceDB delete error for ${namespace}:${objectId}:`, error);
  }
}
