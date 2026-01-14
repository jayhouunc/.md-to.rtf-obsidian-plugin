import {App, DropdownComponent, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";


export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Destination of converted files')
			.setDesc('This is the folder where the notes you converted from markdown (.md) to rich text format (.rtf) are stored.')
			.addDropdown((dropdown) =>
			 dropdown
			  .addOption('0', "The Desktop.")
			  .addOption('1', "Same place as original note.")
			  .addOption('2', "Other. (Please specify below.)") 
			  	//".addOption" gives users options in the plugin settings to choose from. 1st perameter is actual value of option, 2nd perameter is display name of the option.
			  .setValue(this.plugin.folderPathSetting.keyForAccurateDirectory.toString()) 
			  	//Setting the value before any user change here. Which should be either a default or a saved value due to our check on initialization in "main.ts".
			  .onChange(async (value) =>{
				this.plugin.folderPathSetting.keyForAccurateDirectory = parseInt(value);
				if(value === '1')
					this.plugin.folderPathSetting.directoryPath = "";
					//This directory path is set to "" by default when user clicks the option 'same place as original note'.
					//Reason is because at the moment the program doesn't don't know which note it should be looking for.
					//Therefore, the program will have to wait for the user to actually click on a note and press the ".md-to.rtf" button
					//so it can find its directory.


				await this.plugin.saveSettings();
			  })
			);
		
	}

}
