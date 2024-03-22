import { AbstractInputField } from 'packages/core/src/fields/inputFields/AbstractInputField';
import TimeComponent from 'packages/core/src/fields/inputFields/fields/Time/TimeComponent.svelte';
import { parseUnknownToString } from 'packages/core/src/utils/Literal';
import { type SvelteComponent } from 'svelte';

export class TimeIPF extends AbstractInputField<string, string> {
	protected filterValue(value: unknown): string | undefined {
		return parseUnknownToString(value);
	}

	protected getFallbackDefaultValue(): string {
		return '00:00';
	}

	protected getSvelteComponent(): typeof SvelteComponent {
		// @ts-ignore
		return TimeComponent;
	}

	protected rawMapValue(value: string): string {
		return value;
	}

	protected rawReverseMapValue(value: string): string | undefined {
		return value;
	}
}
