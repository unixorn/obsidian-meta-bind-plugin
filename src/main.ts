import { type MarkdownPostProcessorContext, Plugin, type WorkspaceLeaf } from 'obsidian';
import { MetaBindSettingTab } from './settings/SettingsTab';
import { RenderChildType } from './renderChildren/InputFieldMDRC';
import { DateParser } from './parsers/DateParser';
import { MetadataManager } from './metadata/MetadataManager';
import { API } from './api/API';
import { setFirstWeekday } from './utils/DatePickerUtils';
import { createMarkdownRenderChildWidgetEditorPlugin } from './cm6/Cm6_ViewPlugin';
import { MDRCManager } from './MDRCManager';
import { DEFAULT_SETTINGS, type MetaBindPluginSettings } from './settings/Settings';
import { type IPlugin } from './IPlugin';
import { ObsidianMetadataAdapter } from './metadata/ObsidianMetadataAdapter';
import { FaqView, MB_FAQ_VIEW_TYPE } from './utils/faq/FaqView';

export default class MetaBindPlugin extends Plugin implements IPlugin {
	// @ts-ignore defined in `onload`
	settings: MetaBindPluginSettings;

	// @ts-ignore defined in `onload`
	mdrcManager: MDRCManager;

	// @ts-ignore defined in `onload`
	metadataManager: MetadataManager;

	// @ts-ignore defined in `onload`
	api: API;

	async onload(): Promise<void> {
		console.log(`meta-bind | Main >> load`);

		await this.loadSettings();
		await this.saveSettings();

		this.api = new API(this);

		const templateParseErrorCollection = this.api.inputFieldParser.parseTemplates(
			this.settings.inputFieldTemplates,
		);
		if (templateParseErrorCollection.hasErrors()) {
			console.warn('meta-bind | failed to parse templates', templateParseErrorCollection);
		}

		this.mdrcManager = new MDRCManager();

		const metadataAdapter = new ObsidianMetadataAdapter(this);
		this.metadataManager = new MetadataManager(metadataAdapter);

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const codeBlocks = el.querySelectorAll('code');

			for (let index = 0; index < codeBlocks.length; index++) {
				const codeBlock = codeBlocks.item(index);

				if (codeBlock.hasClass('mb-none')) {
					continue;
				}

				const content = codeBlock.innerText;
				const isInputField = content.startsWith('INPUT[') && content.endsWith(']');
				const isViewField = content.startsWith('VIEW[') && content.endsWith(']');

				if (isInputField) {
					this.api.createInputFieldFromString(
						content,
						RenderChildType.INLINE,
						ctx.sourcePath,
						codeBlock,
						ctx,
						undefined,
					);
				}
				if (isViewField) {
					this.api.createViewFieldFromString(content, RenderChildType.INLINE, ctx.sourcePath, codeBlock, ctx);
				}
			}
		}, 100);

		this.registerMarkdownCodeBlockProcessor('meta-bind', (source, el, ctx) => {
			const codeBlock = el;
			const content = source.trim();
			const isInputField = content.startsWith('INPUT[') && content.endsWith(']');
			const isViewField = content.startsWith('VIEW[') && content.endsWith(']');

			if (isInputField) {
				this.api.createInputFieldFromString(
					content,
					RenderChildType.BLOCK,
					ctx.sourcePath,
					codeBlock,
					ctx,
					undefined,
				);
			}
			if (isViewField) {
				this.api.createViewFieldFromString(content, RenderChildType.INLINE, ctx.sourcePath, codeBlock, ctx);
			}
		});

		this.registerMarkdownCodeBlockProcessor('meta-bind-js-view', (source, el, ctx) => {
			this.api.createJsViewFieldFromString(source, RenderChildType.BLOCK, ctx.sourcePath, el, ctx);
		});

		this.registerEditorExtension(createMarkdownRenderChildWidgetEditorPlugin(this));

		// this.addCommand({
		// 	id: 'mb-debugger-command',
		// 	name: 'debugger',
		// 	callback: () => {
		// 		// eslint-disable-next-line no-debugger
		// 		debugger;
		// 	},
		// });

		this.addCommand({
			id: 'mb-open-docs',
			name: 'Open Meta Bind Docs',
			callback: () => {
				window.open('https://mprojectscode.github.io/obsidian-meta-bind-plugin-docs/', '_blank');
			},
		});

		this.addCommand({
			id: 'mb-open-faq',
			name: 'Open Meta Bind FAQ',
			callback: () => {
				void this.activateView(MB_FAQ_VIEW_TYPE);
			},
		});

		this.registerView(MB_FAQ_VIEW_TYPE, leaf => new FaqView(leaf, this));

		this.addSettingTab(new MetaBindSettingTab(this.app, this));
	}

	onunload(): void {
		console.log(`meta-bind | Main >> unload`);
		this.mdrcManager.unload();
		this.metadataManager.unload();
	}

	getFilePathsByName(name: string): string[] {
		const bestLinkPath = this.app.metadataCache.getFirstLinkpathDest(name, '');

		return bestLinkPath === null ? [] : [bestLinkPath.path];
	}

	isFilePathExcluded(path: string): boolean {
		for (const excludedFolder of this.settings.excludedFolders) {
			if (path.startsWith(excludedFolder)) {
				return true;
			}
		}

		return false;
	}

	async loadSettings(): Promise<void> {
		console.log(`meta-bind | Main >> settings load`);

		let loadedSettings = (await this.loadData()) as MetaBindPluginSettings;

		loadedSettings = this.applyTemplatesMigration(Object.assign({}, DEFAULT_SETTINGS, loadedSettings));

		this.settings = loadedSettings;

		await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		console.log(`meta-bind | Main >> settings save`);

		DateParser.dateFormat = this.settings.preferredDateFormat;
		setFirstWeekday(this.settings.firstWeekday);
		await this.saveData(this.settings);
	}

	applyTemplatesMigration(oldSettings: MetaBindPluginSettings): MetaBindPluginSettings {
		return oldSettings;
	}

	async activateView(viewType: string): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null;
		const leaves = workspace.getLeavesOfType(viewType);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({ type: viewType, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}
