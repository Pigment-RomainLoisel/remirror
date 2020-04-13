import escapeStringRegex from 'escape-string-regexp';
import { Suggestion } from 'prosemirror-suggest';

import {
  Extension,
  FromToParameter,
  isNullOrUndefined,
  ManagerMethodParameter,
  noop,
  object,
  plainInputRule,
  ProsemirrorCommandFunction,
} from '@remirror/core';

import {
  EmojiExtensionOptions,
  EmojiObject,
  EmojiSuggestCommand,
  NamesAndAliases,
  SkinVariation,
} from './emoji-types';
import {
  DEFAULT_FREQUENTLY_USED,
  emoticonRegex,
  getEmojiByName,
  getEmojiFromEmoticon,
  populateFrequentlyUsed,
  SKIN_VARIATIONS,
  sortEmojiMatches,
} from './emoji-utils';

export class EmojiExtension extends Extension<EmojiExtensionOptions> {
  /**
   * The name is dynamically generated based on the passed in type.
   */
  get name() {
    return 'emoji' as const;
  }

  get defaultOptions() {
    return {
      defaultEmoji: DEFAULT_FREQUENTLY_USED,
      suggestionCharacter: ':',
      maxResults: 20,
      onSuggestionChange: noop,
      onSuggestionExit: noop,
      suggestionKeyBindings: {},
    };
  }

  private frequentlyUsed!: EmojiObject[];

  protected init() {
    this.frequentlyUsed = populateFrequentlyUsed(this.options.defaultEmoji);
  }

  public inputRules() {
    return [
      // Emoticons
      plainInputRule({
        regexp: emoticonRegex,
        transformMatch: ([full, partial]) => {
          const emoji = getEmojiFromEmoticon(partial);
          return emoji ? full.replace(partial, emoji.char) : null;
        },
      }),

      // Emoji Names
      plainInputRule({
        regexp: /:([\w-]+):$/,
        transformMatch: ([, match]) => {
          const emoji = getEmojiByName(match);
          return emoji ? emoji.char : null;
        },
      }),
    ];
  }

  public commands() {
    const { suggestionCharacter } = this.options;
    const commands = {
      /**
       * Insert an emoji into the document at the requested location by name
       *
       * The range is optional and if not specified the emoji will be inserted
       * at the current selection.
       *
       * @param name - the emoji to insert
       * @param [options] - the options when inserting the emoji.
       */
      insertEmojiByName: (
        name: string,
        options: EmojiCommandOptions = object(),
      ): ProsemirrorCommandFunction => (...arguments_) => {
        const emoji = getEmojiByName(name);
        if (!emoji) {
          console.warn('invalid emoji name passed into emoji insertion');
          return false;
        }

        return commands.insertEmojiByObject(emoji, options)(...arguments_);
      },
      /**
       * Insert an emoji into the document at the requested location.
       *
       * The range is optional and if not specified the emoji will be inserted
       * at the current selection.
       *
       * @param emoji - the emoji object to use.
       * @param [range] - the from/to position to replace.
       */
      insertEmojiByObject: (
        emoji: EmojiObject,
        { from, to, skinVariation }: EmojiCommandOptions = object(),
      ): ProsemirrorCommandFunction => (state, dispatch) => {
        const { tr } = state;
        const emojiChar = skinVariation ? emoji.char + SKIN_VARIATIONS[skinVariation] : emoji.char;
        tr.insertText(emojiChar, from, to);

        if (dispatch) {
          dispatch(tr);
        }

        return true;
      },

      /**
       * Inserts the suggestion character into the current position in the editor
       * in order to activate the suggestion popup..
       */
      openEmojiSuggestions: (
        { from, to }: Partial<FromToParameter> = object(),
      ): ProsemirrorCommandFunction => (state, dispatch) => {
        if (dispatch) {
          dispatch(state.tr.insertText(suggestionCharacter, from, to));
        }

        return true;
      },
    };

    return commands;
  }

  public helpers() {
    return {
      /**
       * Update the emoji which are displayed to the user when the query is not
       * specific enough.
       */
      updateFrequentlyUsed: (names: NamesAndAliases[]) => {
        this.frequentlyUsed = populateFrequentlyUsed(names);
      },
    };
  }

  public suggesters({
    getCommands: getActions,
  }: ManagerMethodParameter): Suggestion<EmojiSuggestCommand> {
    const {
      suggestionCharacter,
      suggestionKeyBindings,
      maxResults,
      onSuggestionChange,
      onSuggestionExit,
    } = this.options;
    // const fn = debounce(100, sortEmojiMatches);

    return {
      noDecorations: true,
      invalidPrefixCharacters: escapeStringRegex(suggestionCharacter),
      char: suggestionCharacter,
      name: this.name,
      appendText: '',
      suggestTag: 'span',
      keyBindings: suggestionKeyBindings,
      onChange: (parameters) => {
        const query = parameters.queryText.full;
        const emojiMatches =
          query.length === 0 ? this.frequentlyUsed : sortEmojiMatches(query, maxResults);
        onSuggestionChange({ ...parameters, emojiMatches });
      },
      onExit: onSuggestionExit,
      createCommand: ({ match }) => {
        const create = getActions('insertEmojiByObject');

        return (emoji, skinVariation) => {
          if (isNullOrUndefined(emoji)) {
            throw new Error(
              'An emoji object is required when calling the emoji suggesters command',
            );
          }

          const { from, end: to } = match.range;
          create(emoji, { skinVariation, from, to });
        };
      },
    };
  }
}

export interface EmojiCommandOptions extends Partial<FromToParameter> {
  /**
   * The skin variation which is a number between `0` and `4`.
   */
  skinVariation?: SkinVariation;
}
