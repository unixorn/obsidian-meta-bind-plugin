import { type IInternalAPI } from './IInternalAPI';
import type MetaBindPlugin from '../main';
import { type App, Component, MarkdownRenderer } from 'obsidian';
import { type DatePickerIPF } from '../fields/inputFields/fields/DatePicker/DatePickerIPF';
import { type ImageSuggesterIPF } from '../fields/inputFields/fields/ImageSuggester/ImageSuggesterIPF';
import { type SuggesterLikeIFP, type SuggesterOption } from '../fields/inputFields/fields/Suggester/SuggesterHelper';
import { type MBLiteral } from '../utils/Literal';
import { TextPromptModal } from '../utils/TextPromptModal';
import { openSuggesterModalForInputField } from '../fields/inputFields/fields/Suggester/SuggesterModalHelper';
import { openImageSuggesterModalForInputField } from '../fields/inputFields/fields/ImageSuggester/ImageSuggesterModalHelper';
import { DatePickerInputModal } from '../fields/inputFields/fields/DatePicker/DatePickerInputModal';

export class ObsidianAPIAdapter implements IInternalAPI {
	readonly plugin: MetaBindPlugin;
	readonly app: App;

	constructor(plugin: MetaBindPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	public openDatePickerModal(inputField: DatePickerIPF): void {
		new DatePickerInputModal(this.app, inputField).open();
	}

	public openImageSuggesterModal(inputField: ImageSuggesterIPF, selectCallback: (selected: string) => void): void {
		openImageSuggesterModalForInputField(inputField, selectCallback, this.plugin);
	}

	public openSuggesterModal(
		inputField: SuggesterLikeIFP,
		selectCallback: (selected: SuggesterOption<MBLiteral>) => void,
	): void {
		openSuggesterModalForInputField(inputField, selectCallback, this.plugin);
	}

	public openTextPromptModal(
		value: string,
		title: string,
		subTitle: string,
		description: string,
		onSubmit: (value: string) => void,
		onCancel: () => void,
	): void {
		new TextPromptModal(this.app, value, title, subTitle, description, onSubmit, onCancel).open();
	}

	public async renderMarkdown(markdown: string, element: HTMLElement, filePath: string): Promise<() => void> {
		const component = new Component();
		await MarkdownRenderer.render(this.app, markdown, element, filePath, component);
		return () => component.unload();
	}
}
