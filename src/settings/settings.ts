import * as os from "os";
import * as path from "path";

interface folderPathSetting{
    directoryPath: string;
    keyForAccurateDirectory: number;
        //-1 = error/undefined/something went wrong
        // 0 = the desktop (default)
        // 1 = same place as the note
        // 2 = other place specified by user
}

export const DEFAULT_FOLDERPATH_SETTING: folderPathSetting = {
    directoryPath: path.join(os.homedir(), "Desktop"),
    keyForAccurateDirectory: 0
}

export const UNDEFINED_FOLDERPATH_SETTING: folderPathSetting = {
    directoryPath: "",
    keyForAccurateDirectory: -1
}

export default class Settings{
    public folderPathSetting: folderPathSetting;
}