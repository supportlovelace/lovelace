import { v1 } from "@authzed/authzed-node";
import { credentials, Metadata } from "@grpc/grpc-js";

if (!process.env.SPICEDB_GRPC_ADDRESS) {
  throw new Error('SPICEDB_GRPC_ADDRESS is not set in environment variables');
}

const endpoint = process.env.SPICEDB_GRPC_ADDRESS;

// Use insecure channel creds for local SpiceDB, per guidelines
export const spicedbClient = v1.NewClientWithChannelCredentials(
  endpoint,
  credentials.createInsecure(),
);

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token = process.env.SPICEDB_GRPC_TOKEN;
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

function parseRef(
  input: string,
  fallbackType: string,
): { type: string; id: string } {
  if (!input) return { type: fallbackType, id: "" };
  const idx = input.indexOf(":");
  if (idx === -1) return { type: fallbackType, id: input };
  return { type: input.slice(0, idx), id: input.slice(idx + 1) };
}

export async function checkPermission(
  subject: string,
  permission: string,
  resource: string,
): Promise<boolean> {
  try {
    const md = makeAuthMetadata();

    // Accept either plain IDs (uses sensible defaults) or "type:id" strings
    const subj = parseRef(subject, "user");
    const resRef = parseRef(resource, "game");

    const req = v1.CheckPermissionRequest.create({
      resource: v1.ObjectReference.create({
        objectType: resRef.type,
        objectId: resRef.id,
      }),
      subject: v1.SubjectReference.create({
        object: v1.ObjectReference.create({
          objectType: subj.type,
          objectId: subj.id,
        }),
      }),
      permission,
    });

    const res = await spicedbClient.promises.checkPermission(req, md);
    return (
      res.permissionship ===
      v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION
    );
  } catch (error) {
    console.error("SpiceDB error:", error);
    return false;
  }
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
