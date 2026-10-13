import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../_utils", () => ({ requireAdminToken: vi.fn() }));
vi.mock("@/services/fetch-platform-models", () => ({ getPlatformModels: vi.fn() }));

import { requireAdminToken } from "../_utils";
import { getPlatformModels } from "@/services/fetch-platform-models";
import { GET } from "./route";
import { NextResponse } from "next/server";

beforeEach(() => vi.resetAllMocks());

describe("platform models admin proxy", () => {
  it("rejects non-admin sessions without contacting the backend", async () => {
    vi.mocked(requireAdminToken).mockResolvedValue({ok:false,response:NextResponse.json({error:"Forbidden"},{status:403})});
    expect((await GET()).status).toBe(403);
    expect(getPlatformModels).not.toHaveBeenCalled();
  });
  it("forwards the signed session token and backend status", async () => {
    vi.mocked(requireAdminToken).mockResolvedValue({ok:true,authToken:"signed-admin-token",role:"admin",username:"admin"});
    vi.mocked(getPlatformModels).mockResolvedValue({models:[],error:"Discovery unavailable",status:503});
    const response = await GET();
    expect(getPlatformModels).toHaveBeenCalledWith("signed-admin-token");
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({models:[],error:"Discovery unavailable"});
  });
});
