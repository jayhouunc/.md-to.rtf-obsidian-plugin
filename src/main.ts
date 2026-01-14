import {FileSystemAdapter, App, Plugin, TFile, Menu, Notice} from 'obsidian'
import { SampleSettingTab } from './settings';
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

	pluginName: string = "(.MD to.RTF Converter) ";
	currentClickedFileDirectory: string;
	

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
			new Notice(this.pluginName + "⚠️Could not set a default directory path. Please manually set one to avoid errors!");
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

	public findAccurateDirectoryBasedOnValue(key: number, file: TFile): void{

		if(key === 0){
			this.folderPathSetting.directoryPath = path.join(os.homedir(), "Desktop")
			this.saveSettings();
		}

		if(key === 1)
			this.setCurrentClickedOnFileDirectory(this.app, file);


	}

	private conversionOfFileToRTF(file: TFile){
		this.findAccurateDirectoryBasedOnValue(this.folderPathSetting.keyForAccurateDirectory, file);

		const outputFilePath: string = path.join(this.folderPathSetting.directoryPath, file.basename + ".rtf");

		try {
			fs.writeFileSync(outputFilePath, "test", 'utf-8');
			console.log(`Successfully created RTF file at ${outputFilePath}`);
		} catch (error) {
			console.error('Error writing RTF file:', error);
		}


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
				new Notice(this.pluginName + "Converting note to RTF.....");
				this.conversionOfFileToRTF(file);
			});
		});
	}


	
}


//this might be code i'll use for implementation of the third (other. please specifiy) option

/*
	//this was in saveSettings() method
		if(this.folderPathSetting.value === "")
				this.folderPathSetting = this.setDefaultFolderPath();
			//If user sets the folder path to nothing, program will attempt to set folder path to the default.
			//The check like last time ( in "checkAndSetDefaultFolderPath()" method) will still run, as again program doesn't know if
			//it can find the desktop or not. 


		if(!existsSync(this.folderPathSetting.value)){
			new Notice(this.pluginName + "⚠️Invalid directory path. Please manually set a valid path to a folder to avoid errors!");
			this.folderPathSetting = this.setDefaultFolderPath();
		}
		//Does the same thing as commented on above, but if the user somehow set the folder path to something invalid or inaccessible.


	private setDefaultFolderPath(): folderPathSetting{
		if(existsSync(DEFAULT_FOLDERPATH.value))
			return DEFAULT_FOLDERPATH;
		else
			return Object.assign({}, undefined);
	}

			
		

*/