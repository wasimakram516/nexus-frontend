import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ post: vi.fn(), getAll: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { post: mocks.post } }));
vi.mock("@/services/users.service", () => ({ usersService: { getAll: mocks.getAll } }));

import { uploadFile } from "./upload";
import { buildUserMap, fetchAllUsers, type UserLite } from "./users";
import { playClose, playOpen, playReceive, playSend } from "./chatSounds";

const user = (id: string): UserLite => ({
  id, name: `U${id}`, email: `${id}@x.io`, role: "STAFF", status: "ACTIVE", institutionId: "i", createdAt: "2026-01-01",
});

beforeEach(() => vi.clearAllMocks());

describe("uploadFile", () => {
  it("posts multipart form data and returns the unwrapped upload result", async () => {
    const result = { url: "https://cdn/x.png", publicId: "p", resourceType: "image", format: "png", folder: "f", bytes: 3 };
    mocks.post.mockResolvedValue({ data: { data: result } });
    const file = new File(["abc"], "x.png", { type: "image/png" });
    await expect(uploadFile(file)).resolves.toEqual(result);
    const [url, form, config] = mocks.post.mock.calls[0];
    expect(url).toBe("/upload");
    expect((form as FormData).get("file")).toBe(file);
    expect(config.headers["Content-Type"]).toBe("multipart/form-data");
  });

  it("adds the subfolder query and reports rounded progress percentages", async () => {
    mocks.post.mockResolvedValue({ data: { data: {} } });
    const onProgress = vi.fn();
    await uploadFile(new File(["a"], "a.pdf"), { subfolder: "documents", onProgress });
    const [url, , config] = mocks.post.mock.calls[0];
    expect(url).toBe("/upload?subfolder=documents");
    config.onUploadProgress({ loaded: 1, total: 3 });
    expect(onProgress).toHaveBeenCalledWith(33);
    onProgress.mockClear();
    config.onUploadProgress({ loaded: 1 });
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("propagates upload failures", async () => {
    mocks.post.mockRejectedValue(new Error("too big"));
    await expect(uploadFile(new File(["a"], "a"))).rejects.toThrow("too big");
  });
});

describe("fetchAllUsers", () => {
  it("pages until the reported total is reached", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => user(`a${i}`));
    const page2 = [user("b1"), user("b2")];
    mocks.getAll
      .mockResolvedValueOnce({ data: { data: { items: page1, total: 102 } } })
      .mockResolvedValueOnce({ data: { data: { items: page2, total: 102 } } });
    const all = await fetchAllUsers();
    expect(all).toHaveLength(102);
    expect(mocks.getAll).toHaveBeenNthCalledWith(1, { page: 1, limit: 100 });
    expect(mocks.getAll).toHaveBeenNthCalledWith(2, { page: 2, limit: 100 });
  });

  it("returns an empty list when the response has no data", async () => {
    mocks.getAll.mockResolvedValue({ data: {} });
    await expect(fetchAllUsers()).resolves.toEqual([]);
    expect(mocks.getAll).toHaveBeenCalledTimes(1);
  });
});

describe("buildUserMap", () => {
  it("indexes users by id", () => {
    const map = buildUserMap([user("1"), user("2")]);
    expect(Object.keys(map)).toEqual(["1", "2"]);
    expect(map["2"].email).toBe("2@x.io");
  });
});

describe("chat sounds", () => {
  it("schedules oscillator tones for each sound with rising envelopes", () => {
    const oscillators: Array<{ start: ReturnType<typeof vi.fn>; frequency: { value: number } }> = [];
    const resume = vi.fn();
    class FakeAudioContext {
      state = "suspended";
      currentTime = 1;
      destination = {};
      resume = resume;
      createOscillator() {
        const osc = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: "sine", frequency: { value: 0 } };
        oscillators.push(osc);
        return osc;
      }
      createGain() {
        return { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
      }
    }
    Object.defineProperty(window, "AudioContext", { value: FakeAudioContext, configurable: true, writable: true });
    playSend();
    expect(oscillators.map((o) => o.frequency.value)).toEqual([700, 900]);
    playReceive();
    playOpen();
    playClose();
    expect(oscillators).toHaveLength(2 + 2 + 3 + 2);
    expect(resume).toHaveBeenCalled();
    expect(oscillators[1].start).toHaveBeenCalledWith(1.05);
  });
});
