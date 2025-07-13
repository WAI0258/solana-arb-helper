import path from "path";
import fs from "fs";

export class FileUtils {
  static ensureDirectoryExists(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        const absoluteDir = path.resolve(dir);
        if (!fs.existsSync(absoluteDir)) {
          fs.mkdirSync(absoluteDir, { recursive: true });
        }
      }
    }
  }

  static safeReadJson<T>(filePath: string, defaultValue: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        return defaultValue;
      }
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return defaultValue;
    }
  }

  static safeWriteJson(filePath: string, data: any, errorMessage: string) {
    try {
      FileUtils.ensureDirectoryExists(filePath);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(errorMessage, error);
      return false;
    }
  }

  static safeDelete(filePath: string, errorMessage: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(errorMessage, error);
      return false;
    }
  }
}
