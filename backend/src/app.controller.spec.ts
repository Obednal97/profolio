import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe("health", () => {
    it("should return health status", () => {
      const result = controller.getHealth();
      
      expect(result).toHaveProperty("status", "ok");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("uptime");
      expect(result).toHaveProperty("environment");
      expect(typeof result.uptime).toBe("number");
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return valid ISO timestamp", () => {
      const result = controller.getHealth();
      const timestamp = new Date(result.timestamp);
      
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });
  });
});