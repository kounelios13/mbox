/***
The MIT License (MIT)

Copyright (c) 2015 Brian Seymour

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 ***/




var mbox = (function () {
    var locales = {
        en: {
            CANCEL: 'Cancel',
            OK: 'OK'
        },
        el: {
            CANCEL: 'Ακύρωση',
            OK: 'Εντάξει'
        },
        it: {
            CANCEL: "Annulla",
            OK: "OK"
        },
        de: {
            CANCEL: "Abbrechen",
            OK: "OK"
        },
        pt: {
            OK: 'Está bem',
            CANCEL: 'cancelar'
        }
    };
    var core = {
        

        global: {
            options: {
                open_speed: 250,
                close_speed: 250,
                locale: 'en',
                dismissible: false,
                bottom_sheet: false,
                fixed_footer:false
            }
        },

        options: {

        },
        set_close_speed: function (speed) {
            if (isNaN(speed)) {
                throw new Error("Speed value must be a number but a " + typeof (speed) + " was given");
            }
            core.global.options.close_speed = speed;
        },
        set_open_speed: function (speed) {
            if (isNaN(speed)) {
                throw new Error("Speed value must be a number but a " + typeof (speed) + " was given");
            }
            core.global.options.open_speed = speed;
        },
        template:
            '<div class="modal mbox-wrapper">' +
                '<div class="z-depth-1">' +
                    '<div class="modal-content">' +
                        '<h5>$$$_message_$$$</h5>' + 
                        '$$$_input_$$$' +
                    '<div class="modal-footer">' + 
                        '$$$_buttons_$$$'+
                    '</div>'+ 
                '</div>' 
            +'</div>',    
        set_locale: function (locale) {
            core.global.options.locale = locale;
        },
        setLocale: this.set_locale,

        add_locale: function (locale, translations) {
            locales[locale.toLowerCase()] = translations;
        },
        addLocale: this.add_locale,
        reset_options: function () {
            core.process_options(core.global.options);
        },
        alert: function () {
            core.reset_options();

            var data = core.parse_args(arguments);

            var message = data.message;
            var cb = data.cb;

            core.open('alert', message);
            
            var mbox_ok_button = document.querySelector('.mbox-wrapper .mbox-ok-button');
            mbox_ok_button.addEventListener("click", function () {
                core.close();
                cb && cb();
            });
        },

        confirm: function () {
            core.reset_options();
            var data = core.parse_args(arguments);
            var message = data.message;
            var cb = data.cb;
            if (!cb) {
                throw new Error('Confirm requires a callback');
            }
            core.open('confirm', message);
            var mbox_ok_button = document.querySelector('.mbox-wrapper .mbox-ok-button');
            var mbox_cancel_button = document.querySelector('.mbox-wrapper .mbox-cancel-button');
            mbox_ok_button.addEventListener("click", function () {
                core.close();
                cb(true);
            });
            mbox_cancel_button.addEventListener("click", function () {
                core.close();
                cb(false);
            });
        },

        prompt: function () {
            core.reset_options();

            var data = core.parse_args(arguments);

            var message = data.message;
            var cb = data.cb;
            if (!cb) {
                throw new Error('Prompt requires a callback');
            }
            core.open('prompt', message);

            var mbox_ok_button = document.querySelector('.mbox-wrapper .mbox-ok-button');
            var mbox_cancel_button = document.querySelector('.mbox-wrapper .mbox-cancel-button');

            //@TODO
            //Find a way to add a common handler to both OK and Cancel buttons

            mbox_ok_button.addEventListener('click', function () {
                var input = document.querySelector('.mbox-wrapper input');
                var entered_text = input.value;
                core.close();
                cb(entered_text);
            });

            mbox_cancel_button.addEventListener('click', function () {
                core.close();
                cb(false);
            });
        },

        custom: function (configuration) {
            core.reset_options();

            if (typeof configuration !== 'object') {
                throw 'Custom box requires argument 1 to be an object';
            }

            typeof configuration.options === 'object' && core.process_options(configuration.options);

            var template = core.template;
            template = template.replace(/\$\$\$_input_\$\$\$/gi, '<hr />');

            if (!configuration.buttons || configuration.buttons.length === 0) {
                throw 'You must provide at least 1 button';
            }

            var buttons = '';

            //@TODO
            //There are 2 loops for configuration.buttons
            //Merge them into one

            configuration.buttons.forEach(function (button, i) {
                var serialized_button = 'mbox-custom-button-' + i;

                buttons += core
                    .gen_button(
                        button.color || 'grey lighten-4',
                        button.label || '',
                        serialized_button
                    );
            });

            template = template.replace(/\$\$\$_message_\$\$\$/gi, configuration.message || '');
            template = template.replace(/\$\$\$_buttons_\$\$\$/gi, buttons);
               
            var open_speed = core.options.open_speed;
            configuration.buttons.forEach(function (button, i) {
                var serialized_button = 'mbox-custom-button-' + i;
                //Event delegation
                document.body.addEventListener('click', function (e) {
                    //classList is a DOMTokenList
                    var classList = e.target.classList;
                    if (classList.contains(serialized_button)) {
                        var callback = button.callback;
                        var has_callback = callback && typeof callback == 'function';
                        if (has_callback) {
                            callback();
                        } else {
                            core.close();
                        }
                    }
                });

            });
            var template_element = document.createElement('div');
            template_element.innerHTML = template;
            var options = core.options || core.global.options;
            if (options.bottom_sheet) {
                template_element.firstChild.classList.add("bottom-sheet");
            }
            if (options.fixed_footer) {
                template_element.firstChild.classList.add("fixed-footer");
            }
            document.body.append(template_element);
            var modal_element = document.querySelector('.modal');
            var options = core.options;
            var modal_options = {
                opacity:options.opacity,
                inDuration: options.open_speed || options.inDuration,
                outDuration: options.close_speed || options.outDuration,
                onOpenStart: options.onOpenStart,
                onOpenEnd: options.onOpenEnd,
                onCloseStart: options.onCloseStart,
                onCloseEnd: options.onCloseEnd,
                dismissible: options.dismissible,
                startingTop: options.startingTop,
                startingEnd:options.startingEnd
            };
            var modal_instance = M.Modal.init(modal_element, modal_options);
            modal_instance.open();
        },

        open: function (type, message) {
            var template = core.template;
            var input = '<input type="text" />';
            var buttons;
            var locale_name = null;
            if (core.options.locale) {
                //User requested a specific locale
                locale_name = core.options.locale;
            } else {
                locale_name = core.global.options.locale;
            }
            var locale = locales[locale_name];
            switch (type) {
                case 'alert':
                    buttons = core.gen_button('light-blue darken-2', locale.OK, 'mbox-ok-button');
                    template = template.replace(/\$\$\$_input_\$\$\$/gi, '<hr />');
                    break;

                case 'confirm':
                    buttons = core.gen_button('light-blue darken-2', locale.OK, 'mbox-ok-button');
                    buttons += core.gen_button('grey darken-2', locale.CANCEL, 'mbox-cancel-button');
                    template = template.replace(/\$\$\$_input_\$\$\$/gi, '<hr />');
                    break;

                case 'prompt':
                    buttons = core.gen_button('light-blue darken-2', locale.OK, 'mbox-ok-button');
                    buttons += core.gen_button('grey darken-2', locale.CANCEL, 'mbox-cancel-button');
                    template = template.replace(/\$\$\$_input_\$\$\$/gi, input);
                    break;
            }

            if (message) template = template.replace(/\$\$\$_message_\$\$\$/gi, message);
            if (buttons) template = template.replace(/\$\$\$_buttons_\$\$\$/gi, buttons);
        
            var template_element = document.createElement('div');
            template_element.innerHTML = template;
            var options = core.options || core.global.options
            if (options.bottom_sheet) {
                template_element.firstChild.classList.add("bottom-sheet");
            }
            if (options.fixed_footer) {
                template_element.firstChild.classList.add("fixed-footer");
            }
            document.body.append(template_element);
            //Since materializecss@1.0.0 we need to manually initialize modals
            var modal_element = document.querySelector('.modal');
            var modal_options = {
                opacity: options.opacity || 0.5 ,
                inDuration: options.open_speed || options.inDuration || 250,
                outDuration: options.close_speed || options.outDuration || 250,
                onOpenStart: options.onOpenStart,
                onOpenEnd: options.onOpenEnd,
                onCloseStart: options.onCloseStart,
                onCloseEnd: options.onCloseEnd,
                dismissible: options.dismissible,
                startingTop: options.startingTop,
                startingEnd: options.startingEnd
            };
            console.log(options)
            var modal_instance = M.Modal.init(modal_element, modal_options);
            // show the box
            modal_instance.open();
            // focus the button
            var mbox_button = document.querySelector('.mbox-wrapper .mbox-ok-button');
            mbox_button.focus();
        },

        close: function () {
            var modal_element = document.querySelector('.modal');
            //Sometimes modal_instance might be null
            //so check before closing
            var modal_instance = M.Modal.getInstance(modal_element);
            modal_instance && modal_instance.close();
            modal_element.remove();
            // unbind all the mbox buttons
            //Do we have to do that?
            var mbox_buttons = document.querySelectorAll('.mbox-button');
            /* mbox_buttons.forEach(function (btn) {
                btn.removeEventListener("click"); 
            }); */
        },

        parse_args: function (args) {
            var args = [].slice.call(args);

            var ret = {
                message: null,
                cb: null
            }

            args.forEach(function (arg) {
                if (typeof arg === 'string') ret.message = arg;
                if (typeof arg === 'function') ret.cb = arg;
                if (typeof arg === 'object') core.process_options(arg);
            }, this);

            return ret;
        },

        process_options: function (options) {
            Object.keys(options).forEach(function (key) {
                core.options[key] = options[key];
            }, this);
        },


        gen_button: function (color, text, type) {
            return '&nbsp;<button ' +
                'type="button" ' +
                'class="mbox-button ' + type + ' ' +
                'waves-effect waves-light btn ' + color + '">' + text +
                '</button>';
        }
    };
    //Make sure that we expose only the public api(not sure about close() though)
    return {
        alert: core.alert,
        confirm: core.confirm,
        prompt: core.prompt,
        custom: core.custom,
        add_locale: core.add_locale,
        set_locale: core.set_locale,
        close: core.close,
        set_open_speed: core.set_open_speed,
        set_close_speed:core.set_close_speed
    }
})();