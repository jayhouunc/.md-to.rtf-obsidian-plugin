import {App, PluginSettingTab, Setting} from "obsidian";
import mdToRtfPlugin from "./main";


export class mdToRtfPluginSettings extends PluginSettingTab {
	plugin: mdToRtfPlugin;

	constructor(app: App, plugin: mdToRtfPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		this.createDirectoryPicker();
	}

	private deleteCustomDirectoryOption(): void{
		this.containerEl.empty();
		this.createDirectoryPicker();
	}

	private createCustomDirectoryOption(){
		new Setting(this.containerEl)
		.setName("Custom Directory: ")
		.setDesc("Please write out FULL PATH (from top-level directory). NOT local!")
		.addText(async (text) =>{
			text
			 .setPlaceholder("")
			 .setValue(this.plugin.folderPathSetting.directoryPath)
			 .onChange((value) =>{
				this.plugin.folderPathSetting.directoryPath = value;
				this.plugin.saveSettings();
			 })
		})
	}

	private createDirectoryPicker(){
		new Setting(this.containerEl)
		 .setName('Destination of converted files')
		 .setDesc('This is the folder where the notes you converted from markdown (.md) to rich text format (.rtf) are stored.')
		 .addDropdown((dropdown) =>
			dropdown
			.addOption('0', "The Desktop.")
			.addOption('1', "Same place as original note.")
			.addOption('2', "Other. (Custom directory. Please specify below.)") 
			.setValue(this.savedValueHandling(this.plugin.folderPathSetting.keyForAccurateDirectory.toString()))
			.onChange(async (value) =>{
				this.pickedValueHandling(value);
			})
		);
	}

	private savedValueHandling(value: string): string{
		if(value === '2')
			this.createCustomDirectoryOption();

		return value;
	}

	private async pickedValueHandling(value: string){
		this.plugin.folderPathSetting.keyForAccurateDirectory = parseInt(value);
		await this.plugin.saveSettings();

		switch(value){
			case '0':
				this.deleteCustomDirectoryOption();
				this.plugin.checkForValidDesktopBeforeSaving();
				break;
			case '1':
				this.deleteCustomDirectoryOption();
				this.plugin.folderPathSetting.directoryPath = "";
				await this.plugin.saveSettings();
				break;
			case '2':
				this.plugin.folderPathSetting.directoryPath = "";
				this.createCustomDirectoryOption();
				break;
		}
		
			
	}

}
