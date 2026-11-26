import { repo } from "@/lib/repo";
import { withAdmin } from "@/lib/server/admin";
import { ok } from "@/lib/server/http";

export const GET = withAdmin(async () => ok({ messages: await repo.listMessages() }));
