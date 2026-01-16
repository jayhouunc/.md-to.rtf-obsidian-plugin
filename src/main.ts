import {FileSystemAdapter, App, Plugin, TFile, Menu, Notice} from 'obsidian'
import {SampleSettingTab } from './settings';
import ToRTFConverter from './converter'
import * as fs from 'fs';
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
	currentClickedFileDirectory: string;
	
	converter: ToRTFConverter = new ToRTFConverter();
	
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
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	public async saveSettings(){
		await this.saveData(this.folderPathSetting);
	}


	private async checkAndSetDefaultFolderPath(){
		
		//This checking for the default folder path exists because if a user has named their desktop something else, we won't be able to find it
		//since the default folder path is set to the desktop. ( Which was also made flexible to any operating system when declared. )
		//If we can not find the desktop and set the default folder path to it, program will continue on with the path as "undefined" unless
		//set by user. 
		//When "undefined" is encountered later in the program (e.g. when program is trying to do the conversion from .md to .rtf), it will not continue
		//and prompt the user to set a valid path.  

		//Also, you may notice that the program isn't in fact saving it. (there is no saveSettings() method call)
		//That means yes, every time plugin is reloaded, obsidian is reloaded, etc...
		//If the user has not set a directory path, the program will keep setting the data in the folderPathSetting to the defaults. 
		//(In that case, the memory is volitile, not saved, and just ran runtime then deleted eventually when everything stops.)

		this.folderPathSetting = Object.assign({}, await this.loadData());
		if(this.folderPathSetting.keyForAccurateDirectory != 0 && this.folderPathSetting.keyForAccurateDirectory != -1)
			return;
			//Stops the check right here if the user has already set the folder path to something else besides default.
			//(As stated above in the interface declaration. "0 = Desktop (Default), -1 = undefined/error")

		if(fs.existsSync(DEFAULT_FOLDERPATH_SETTING.directoryPath)){
			this.folderPathSetting = Object.assign({}, DEFAULT_FOLDERPATH_SETTING); 
			//Will assign the default folder path ( as the desktop, if we can find the path to the desktop )
		}else{
			this.folderPathSetting = Object.assign({}, UNDEFINED_FOLDERPATH_SETTING);
			mdToRtfPlugin.newErrorNotice("Could not set a default directory path. Please manually set one to avoid errors!");
			//Will assign undefined folder path setting to folder path setting if default (dekstop) directory could not be found.
		}

	}


	private setCurrentClickedOnFileDirectory(app: App, file: TFile): void{

		const adapter = app.vault.adapter;
		let tempString: string

		if (adapter instanceof FileSystemAdapter){
			tempString = adapter.getFullPath(file.path);
			this.currentClickedFileDirectory = tempString.replace(file.name, "");

			this.folderPathSetting.directoryPath = this.currentClickedFileDirectory;
			this.saveSettings();
		}

	}

	public checkForValidDesktopBeforeSaving(): number{
		if(fs.existsSync(DEFAULT_FOLDERPATH_SETTING.directoryPath)){
			this.folderPathSetting.directoryPath = DEFAULT_FOLDERPATH_SETTING.directoryPath;
			this.saveSettings();
			return 0;
		}else{
			mdToRtfPlugin.newErrorNotice("Could not find the desktop! Please rename the desktop to 'Desktop' or change plugin setting to custom directory.");
			return -1;
		}
			
	}

	private checkValidDirectoryPath(directoryPath: string): number{

		if(fs.existsSync(directoryPath))
			return 0;
		else{
			mdToRtfPlugin.newErrorNotice("Invalid custom directory path. Please set a valid path to a folder to avoid errors!");
			return -1;
		}

	}
	private findAccurateDirectoryBasedOnValue(key: number, file: TFile): number{

		if(key === 0)
			return this.checkForValidDesktopBeforeSaving();
			
		if(key === 1){
			this.setCurrentClickedOnFileDirectory(this.app, file);
			return 0;
		}
		
		if(key === 2)
			return this.checkValidDirectoryPath(this.folderPathSetting.directoryPath);

		return 0;

	}

	private conversionOfFileToRTF(file: TFile){
		
		if(this.findAccurateDirectoryBasedOnValue(this.folderPathSetting.keyForAccurateDirectory, file) === -1)
			return;

		const outputFilePath: string = path.join(this.folderPathSetting.directoryPath, file.basename + ".rtf");
		this.converter.convert(outputFilePath);
		

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

	public static newErrorNotice(text: string): Notice{
		return new Notice(this.pluginName + "⚠️" + text);
	}
	
}