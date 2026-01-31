import {FileSystemAdapter, App, Plugin, TFile, Menu, Notice} from 'obsidian'
import { mdToRtfPluginSettings } from './settings';
import * as fs from 'fs';
import * as os from "os";
import * as path from "path";
import ConversionLogicHandeler from 'converter/conversion-logic-handler';

interface folderPathSetting{
	directoryPath: string;
	keyForAccurateDirectory: number;
		//-1 = error/undefined/something went wrong
		// 0 = the desktop (default)
		// 1 = same place as the note
		// 2 = other place specified by user
}

const DEFAULT_FOLDERPATH_SETTING: folderPathSetting = {
	directoryPath: path.join(os.homedir(), "Desktop"),
	keyForAccurateDirectory: 0
}

const UNDEFINED_FOLDERPATH_SETTING: folderPathSetting = {
	directoryPath: "",
	keyForAccurateDirectory: -1
}

export default class mdToRtfPlugin extends Plugin{
	
	folderPathSetting: folderPathSetting;

	public static pluginName: string = "(.MD to.RTF Converter) ";
	
	
	async onload(){
		this.loadSettings();
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file:TFile) =>{
				if(file instanceof TFile && file.extension === "md")
					this.addMenuItems(menu, file);
			})
		);

	}

	public loadSettings(){
		this.checkAndSetDefaultFolderPath();
		this.addSettingTab(new mdToRtfPluginSettings(this.app, this));
	}

	public async saveSettings(){
		await this.saveData(this.folderPathSetting);
	}


	private async checkAndSetDefaultFolderPath(){
		this.folderPathSetting = Object.assign({}, await this.loadData());
		if(this.folderPathSetting.keyForAccurateDirectory > 0)
			return;
		if(fs.existsSync(DEFAULT_FOLDERPATH_SETTING.directoryPath)){
			this.folderPathSetting = Object.assign({}, DEFAULT_FOLDERPATH_SETTING); 
		}else{
			this.folderPathSetting = Object.assign({}, UNDEFINED_FOLDERPATH_SETTING);
			mdToRtfPlugin.newErrorNotice("Could not set a default directory path. Please manually set one to avoid errors!", "");
		}

	}


	private setCurrentClickedOnFileDirectory(app: App, file: TFile): boolean{

		const adapter = app.vault.adapter;
		let tempPathString: string

		if (adapter instanceof FileSystemAdapter){
			tempPathString = adapter.getFullPath(file.path).replace(file.name, "");
			if(!this.checkValidDirectoryPath(tempPathString)) return false; //Checking to see if it's valid anyway
			this.folderPathSetting.directoryPath = tempPathString
			this.saveSettings();
			return true;
		}else{
			mdToRtfPlugin.newErrorNotice("Could not find 'FileSystemAdapter'", "");
			return false;
		}

		

	}

	public checkForValidDesktopBeforeSaving(): boolean{
		if(fs.existsSync(DEFAULT_FOLDERPATH_SETTING.directoryPath)){
			this.folderPathSetting.directoryPath = DEFAULT_FOLDERPATH_SETTING.directoryPath;
			this.saveSettings();
			return true;
		}else{
			mdToRtfPlugin.newErrorNotice("Could not find the desktop! Please rename the desktop to 'Desktop' or change plugin setting to custom directory.", "");
			return false;
		}
			
	}

	private checkValidDirectoryPath(directoryPath: string): boolean{

		if(fs.existsSync(directoryPath))
			return true;
		else{
			mdToRtfPlugin.newErrorNotice("Invalid custom directory path. Please set a valid path to a folder to avoid errors!", "");
			return false;
		}

	}
	
	private findAccurateDirectoryBasedOnKey(key: number, file: TFile): boolean{
		switch(key){
			case 0:
				return this.checkForValidDesktopBeforeSaving();
			case 1:
				return this.setCurrentClickedOnFileDirectory(this.app, file);
			case 2:
				return this.checkValidDirectoryPath(this.folderPathSetting.directoryPath);
			default:
				mdToRtfPlugin.newErrorNotice("Invalid option for folder path setting. ", "");
				return false;
		}
	}

	private async conversionOfFileToRTF(file: TFile){
		
		if(!this.findAccurateDirectoryBasedOnKey(this.folderPathSetting.keyForAccurateDirectory, file))
			return;
		
		
		let inputFilePath: string;
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) inputFilePath = adapter.getFullPath(file.path);
		else {
			mdToRtfPlugin.newErrorNotice("Could not find 'FileSystemAdapter'", "");
			return;
		}

		const outputFilePath: string = path.join(this.folderPathSetting.directoryPath, file.basename + ".rtf");
		const conversionHandeler: ConversionLogicHandeler = new ConversionLogicHandeler();
		conversionHandeler.convert(inputFilePath, outputFilePath);
		

	}



	private addMenuItems(menu: Menu, file: TFile){
		menu.addItem((item) =>{
			item.setTitle(".md-to-.rtf ↴");
			item.setIsLabel(true);
			item.setDisabled(true);
			item.setSection("action");
		})

		menu.addItem((item) =>{
			item.setSection("action");
			item.setTitle("⠀Convert note to RTF");
			item.setIcon('file-symlink');
			item.onClick(async () =>{
				mdToRtfPlugin.newNotice("Converting note to RTF.....");
				this.conversionOfFileToRTF(file);
			});
		});
	}


	
	public static newNotice(text: string): Notice{
		return new Notice(this.pluginName + " " + text);
	}

	public static newErrorNotice(text: string, errorText: any): Notice{
		//If there isn't an error to pass in, just set errorText argument to ""
		if(errorText == "")
			return new Notice(this.pluginName + "⚠️" + text);

		return new Notice(this.pluginName + "⚠️" + text + " (" + errorText.toString() + ")");
	}
	
}