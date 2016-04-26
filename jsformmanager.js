function JsFormManager(name, wrapperId) { this.init(name, wrapperId) };

/*
 FORM
 */

/**
 *
 * @param name
 * @param wrapperId
 */
JsFormManager.prototype.init = function(name, wrapperId) {


    if(typeof name === 'undefined') {
        throw new TypeError('JsFormManager must have a name parameter');
    }
    //Inject the form instance into child prototypes
    JsFormManager.prototype.form = this;
    JsFormManager.prototype.Field.prototype.form = this;
    JsFormManager.prototype.Validator.prototype.form = this;

    this.wrapperId = wrapperId;
    this.name = name;



    this.wrapper = document.getElementById(this.wrapperId);
    this.fields = {};
    if (typeof options === 'object') {
        for(var i in options) { this[i] = options[i]; }
    }

    //Define some default properties
    this.method = this.method || '';
    this.class = this.class || '';
    this.action = this.action || '';

};



JsFormManager.prototype.bindSelect = function(idselect,idselectMsg) {
    var selectElem = document.getElementById(idselect);
    if (selectElem.getAttribute('name') === null) {selectElem.setAttribute('name',idselect)}
    var field = new this.SelectField(selectElem.getAttribute('name'),{
        element: selectElem,
        msgElement : idselectMsg ? document.getElementById(idselectMsg) : document.getElementById(selectElem.getAttribute('name')+'_msg'),
        id: idselect
    });
    var optionsElems = selectElem.childNodes;
    field.options = {};
    for (var i = 0; i< optionsElems.length; i++) {
        var child = optionsElems[i];
        if (child.nodeName === 'OPTION') {
            field.options[child.value] = child.innerHTML;
        }
    }
    console.log(field);
    this.addField(field);
    field.listen();

    return field;

};



JsFormManager.prototype.bindText = function(idinput,idMsg) {
    var elem = document.getElementById(idinput);
    if (elem.getAttribute('name') === null) {elem.setAttribute('name',idinput)}
    var field = new this.TextField(elem.getAttribute('name'),{
        element: elem,
        msgElement : idMsg ? document.getElementById(idMsg) : document.getElementById(elem.getAttribute('name')+'_msg'),
        id: idinput
    });
    this.addField(field);
    field.listen();

    return field;
};

JsFormManager.prototype.addField = function(field) {
    this.fields[field.name] = field;
};

JsFormManager.prototype.validate= function() {
    var valid = true;
    for (var i in this.fields) {
        if (!this.fields[i].validate()) {
            valid = false;
        }
    }
    return valid;
};

JsFormManager.prototype.render= function() {
    var renderer = '<form name="'+this.name+'" id="'+this.name+'" class="'+this.class+'" method="'+this.method+'" action="'+this.action+'">';
    for (var i in this.fields){
        renderer += this.fields[i].getRenderer();
    }
    renderer += '</form>';

    this.wrapper.innerHTML = renderer;
    // bind listeners
    for (var i in this.fields) {
        this.fields[i].listen();
        this.fields[i].hookElements();
    }
    //bind form and events
    this.formElem = document.getElementById(this.name);
    this.formElem.addEventListener('submit', this.onSubmit.bind(this));
};

JsFormManager.prototype.onSubmit = function(e) {
    if (this.validate()) {
        return true;
    }
    else {
        e.preventDefault();
        console.log('form not valid');
    }
};






/*
 FIELDS
 */

/**
 *
 * @param name
 * @param options
 * @constructor
 */
JsFormManager.prototype.Field = function(name, options) { this.init(name, options)}

JsFormManager.prototype.Field.prototype.init = function(name, options){

    if(typeof name === 'undefined') {
        throw new TypeError('a field must have a name');
    }
    this.name = name;
    if (typeof options === 'object') {
        for(var i in options) { this[i] = options[i]; }
    }

    //Define some default properties
    this.validators = this.validators || [];
    this.class = this.class || '';
    this.id = this.id || this.form.name+'_'+this.name;
    this.value = this.value || '';
    this.htmlAttributes = this.htmlAttributes || {};

};

JsFormManager.prototype.Field.prototype.listen = function() {
    //used for checkboxes and multi-name elements.
    var elems =document.getElementsByName(this.name);
    console.log(elems);
    //used for others
    var elem = document.getElementById(this.id);
    if (this instanceof JsFormManager.prototype.TextField) {
        elem.addEventListener('keyup', this.changeListener.bind(this), false);
    }
    else if (this instanceof JsFormManager.prototype.CheckboxField) {
        elem.addEventListener('click', this.changeListener.bind(this), false);
    }
    else if (this instanceof JsFormManager.prototype.SelectField) {
        elem.addEventListener('change', this.changeListener.bind(this), false);
    }
    else if (this instanceof JsFormManager.prototype.RadioField) {

        for (var i=0; i<elems.length; i++) { elems[i].addEventListener('click', this.changeListener.bind(this), false);};
    }
    else {
        elem.addEventListener('keyup', this.changeListener.bind(this), false);
    }


};

JsFormManager.prototype.Field.prototype.getHtmlAttributesString = function(){
    var str ='';
    for(var param in this.htmlAttributes)  {
        str+= param+'="'+this.htmlAttributes[param]+'"';
    }
    return str;
};

JsFormManager.prototype.Field.prototype.changeListener = function(e){
    if (this instanceof JsFormManager.prototype.RadioField) {
        var options = document.getElementsByName(this.name);
        this.value = '';
        for (var i=0; i<options.length; i++ ) {
            if (options[i].checked) { this.value = options[i].getAttribute('value');}
        }
    }
    else {
        this.value = document.getElementById(this.id).value;
    }
    this.validate();
};


JsFormManager.prototype.Field.prototype.addValidator = function(validator) {
    if (!validator instanceof JsFormManager.prototype.Validator) {
        throw new TypeError('validator must be an instance of JsFormManager.Validator');
    }
    this.validators.push(validator);
};

/**
 * Used to render a single form field.
 * @param wrapperId
 */
JsFormManager.prototype.Field.prototype.render = function(wrapperId) {
    document.getElementById(wrapperId).innerHTML = this.getRenderer();
    this.listen();
    this.hookElements();
};

/**
 * Called once the field of the form in rendered, bind dom elements.
 */
JsFormManager.prototype.Field.prototype.hookElements = function() {
    this.element = document.getElementById(this.id);
    this.elements = document.getElementsByName(this.id);

    this.msgElement = document.getElementById('msg_'+this.id);
    this.wrapperElement = document.getElementById('wrapper_'+this.id);
};

/**
 * Validate the field
 * @returns {boolean}
 */
JsFormManager.prototype.Field.prototype.validate = function() {
    var valid = true;

    for (var i = 0, x= this.validators.length; i<x; i++) {

        var v = this.validators[i];
        if (!v.isValid(this.value, this.element)) {

            valid = false;
            this.msgElement.innerHTML= v.label;
            if (this.msgElement.classList) {
                this.msgElement.classList.add('error');
            }

        }
    }
    if (valid) {
        this.msgElement.innerHTML= '';
        if (this.msgElement.classList) {
            this.msgElement.classList.remove('error');
        }

    }
    return valid;
};

/**
 * Text Field
 * @type {JsFormManager.Field|*}
 */
JsFormManager.prototype.TextField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.TextField.prototype = Object.create(JsFormManager.prototype.Field.prototype);
JsFormManager.prototype.TextField.prototype.type = 'text';

JsFormManager.prototype.TextField.prototype.getRenderer = function(){
    var render = '<div class="wrapper_'+this.id+'"><input '+this.getHtmlAttributesString() +' type="'+this.type+'" class="'+this.class+'" name="'+this.name+'" id="'+this.id+'" />';
    render+='<span class="msg" id="msg_'+this.id+'"></span></div>';
    return render;
};



JsFormManager.prototype.TextAreaField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.TextAreaField.prototype = Object.create(JsFormManager.prototype.Field.prototype);
JsFormManager.prototype.TextAreaField.prototype.type = 'text';

JsFormManager.prototype.TextAreaField.prototype.getRenderer = function(){
    var render = '<div class="wrapper_'+this.id+'"><textarea '+this.getHtmlAttributesString() +' class="'+this.class+'" name="'+this.name+'" id="'+this.id+'" >'+this.value+'</textarea>';
    render+='<span class="msg" id="msg_'+this.id+'"></span></div>';
    return render;
};


JsFormManager.prototype.SubmitField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.SubmitField.prototype = Object.create(JsFormManager.prototype.Field.prototype);

JsFormManager.prototype.SubmitField.prototype.getRenderer = function(){
    var render = '<div class="wrapper_'+this.id+'"><button '+this.getHtmlAttributesString() +' class="'+this.class+'" name="'+this.name+'" id="'+this.id+'" >';
    render+=this.value+'</button><span class="msg" id="msg_'+this.id+'"></span></div>';
    return render;
};


JsFormManager.prototype.CheckboxField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.CheckboxField.prototype = Object.create(JsFormManager.prototype.Field.prototype);

JsFormManager.prototype.CheckboxField.prototype.getRenderer = function(){
    var render = '<div class="wrapper_'+this.id+'">';
    render += '<label for="'+this.id+'">'+this.label+'</label>';
    render += '<input type="hidden" name="'+this.name+'"/>';
    render += '<input '+this.getHtmlAttributesString() +' type="checkbox" value="'+this.value+'" class="'+this.class+'" name="'+this.name+'" id="'+this.id+'" />';
    render += '<span class="msg" id="msg_'+this.id+'"></span>';

    render+='</div>';
    return render;
};

JsFormManager.prototype.EmailField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.EmailField.prototype = Object.create(JsFormManager.prototype.TextField.prototype);
JsFormManager.prototype.EmailField.prototype.type = "email";

JsFormManager.prototype.NumberField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.NumberField.prototype = Object.create(JsFormManager.prototype.TextField.prototype);
JsFormManager.prototype.NumberField.prototype.type = "number";

JsFormManager.prototype.PhoneField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.PhoneField.prototype = Object.create(JsFormManager.prototype.TextField.prototype);
JsFormManager.prototype.PhoneField.prototype.type = "tel";

JsFormManager.prototype.PasswordField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.PasswordField.prototype = Object.create(JsFormManager.prototype.TextField.prototype);
JsFormManager.prototype.PasswordField.prototype.type = "password";

JsFormManager.prototype.HiddenField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.HiddenField.prototype = Object.create(JsFormManager.prototype.TextField.prototype);
JsFormManager.prototype.HiddenField.prototype.type = "hidden";

JsFormManager.prototype.SelectField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.SelectField.prototype = Object.create(JsFormManager.prototype.Field.prototype);

JsFormManager.prototype.SelectField.prototype.getRenderer = function() {
    var render = '<div class="wrapper_'+this.id+'">';
    render += '<label for="'+this.id+'">'+this.label+'</label>';
    render += '<select '+this.getHtmlAttributesString() +' class="'+this.class+'" name="'+this.name+'" id="'+this.id+'" >';
    for (var i in this.options){
        render += '<option value="'+i+'" selected="'+(i === this.value ? 'true':'false')+'">'+this.options[i]+'</option>';
    }
    render += '</select>';
    render += '<span class="msg" id="msg_'+this.id+'"></span>';

    render+='</div>';
    return render;
};

/**
 * Date Field (must be date formated (AAAA-MM-DD)
 * @param name
 * @param options
 * @constructor
 */
JsFormManager.prototype.DateField = function(name, options) {
    this.init(name, options);
    this.dateValidator = new this.form.DateValidator({label: "This field must be date formated"});
};
JsFormManager.prototype.DateField.prototype = Object.create(JsFormManager.prototype.TextField.prototype);
JsFormManager.prototype.DateField.prototype.type = 'date';

JsFormManager.prototype.DateField.prototype.validate = function() {
    this.validators.push(this.dateValidator);
    JsFormManager.prototype.Field.prototype.validate.call(this);
};




JsFormManager.prototype.RadioField = function(name, options) { this.init(name, options);};
JsFormManager.prototype.RadioField.prototype = Object.create(JsFormManager.prototype.Field.prototype);

JsFormManager.prototype.RadioField.prototype.getRenderer = function() {
    var render = '<div class="wrapper_'+this.id+'">';
    render += '<label for="'+this.id+'">'+this.label+'</label>';
    for (var i in this.options){
        var checked = this.value && i == this.value ? 'checked': '';

        render += '<span '+this.getHtmlAttributesString() +' class="radioitem"><input name="'+this.name+'" type="radio" value="'+i+'" '+checked+' />'+ this.options[i]+'</span>';
    }
    render += '<span class="msg" id="msg_'+this.id+'"></span>';

    render+='</div>';
    return render;


};

/*
 VALIDATORS
 */

/**
 * A generic validator object
 * @param properties
 * @constructor
 */
JsFormManager.prototype.Validator = function(properties) { this.init(properties)};
JsFormManager.prototype.Validator.prototype.init = function(properties) {
    if (typeof properties === 'object') {
        for(var i in properties) { this[i] = properties[i]; }
    }
};

/**
 * Required Validator
 * @type {JsFormManager.Validator|*}
 */
JsFormManager.prototype.RequiredValidator = function(properties) {this.init(properties)}
JsFormManager.prototype.RequiredValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);

JsFormManager.prototype.RequiredValidator.prototype.isValid = function(value) {
    return value !== '' && value != null && typeof value !== 'undefined';

};

/**
 * Checked Validator, used for checkboxes
 * @param properties
 * @constructor
 */
JsFormManager.prototype.CheckedValidator = function(properties) {this.init(properties)}
JsFormManager.prototype.CheckedValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);

JsFormManager.prototype.CheckedValidator.prototype.isValid = function(value, element) {

    return element.checked;

};

JsFormManager.prototype.RegexValidator = function(properties) {
    if (!properties.pattern) { throw new TypeError('RegexValidator must have a "pattern" property');}
    this.init(properties)
};
JsFormManager.prototype.RegexValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.RegexValidator.prototype.isValid = function(value, element) {
    console.log(value);
    return this.pattern.test(value);

};


JsFormManager.prototype.SameAsValidator = function(properties) {
    if (!properties.name) { throw new TypeError('SameAsValidator must have a "name" property who reference the other field');}
    this.init(properties)
};
JsFormManager.prototype.SameAsValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.SameAsValidator.prototype.isValid = function(value, element) {
    var sameValue = this.form.fields[this.name].value;
    return value === sameValue;

};

JsFormManager.prototype.MinValidator = function(properties) {
    if (!properties.value) { throw new TypeError('MinValidator must have a "value" property');}
    this.init(properties)
};
JsFormManager.prototype.MinValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.MinValidator.prototype.isValid = function(value, element) {
    return value >= this.value;

};

JsFormManager.prototype.MaxValidator = function(properties) {
    if (!properties.value) { throw new TypeError('MaxValidator must have a "value" property');}
    this.init(properties)
};
JsFormManager.prototype.MaxValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.MaxValidator.prototype.isValid = function(value, element) {
    return value <= this.value;

};

JsFormManager.prototype.BetweenValidator = function(properties) {
    if (!properties.min) { throw new TypeError('BetweenValidator must have a "min" property');}
    if (!properties.max) { throw new TypeError('BetweenValidator must have a "max" property');}
    this.init(properties)
};
JsFormManager.prototype.BetweenValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.BetweenValidator.prototype.isValid = function(value, element) {
    return value >= this.min && value <= this.max;

};

JsFormManager.prototype.DateValidator = function(properties) {this.init(properties)};
JsFormManager.prototype.DateValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.DateValidator.prototype.isValid = function(value, element) {
    var dateregexp = new RegExp('^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$');
    return dateregexp.test(value) && !isNaN(Date.parse(value));

};


JsFormManager.prototype.MinLengthValidator = function(properties) {
    if (!properties.value) { throw new TypeError('MinLengthValidator must have a "value" property');}
    this.init(properties)
};
JsFormManager.prototype.MinLengthValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.MinLengthValidator.prototype.isValid = function(value, element) {
    return value.length >= this.value;

};


JsFormManager.prototype.MaxLengthValidator = function(properties) {
    if (!properties.value) { throw new TypeError('MaxLengthValidator must have a "value" property');}
    this.init(properties)
};
JsFormManager.prototype.MaxLengthValidator.prototype = Object.create(JsFormManager.prototype.Validator.prototype);
JsFormManager.prototype.MaxLengthValidator.prototype.isValid = function(value, element) {
    return value.length <= this.value;

};














