/*

Copyright 2019 Marc Espín Sanz

Check LICENSE.md 

*/
module.exports = {
  execute : function(input) {
  let data = {
    arrayed: input.code
      .replace (/(\r\n|\n|\r)/gm, ' ')
      .split (
        /\s|(\()([\w\s!?="`[<>,\/*':&.;_-{}]+)(\))|\s|(\<)([\w\s!?="`[,\/*()':&.;_-{}]+)(\>)|\s|(\()([\w\s!?="<>`[,'+:&.;_-{}]+)(\))\s|(\B\$)(\w+)|\s(\/\*)([\w\s!?()="<>`[':.;_-{}]+)(\*\/)|("[\w\s!?():=`.;_-{}]+")\s|(%%)([\w\s!?()="+<>`[\/'*,.;_-{}]+)(%%)|("[\w\s!?()='.`;_-{}]+")/g
      ),
    current_keyword: null,
    output: '',
    compression: input.compression == true ? true : false,
    errorsOnPlayground:input.showErrorsOnPlayground,
    storedFunctions: [],
    storedVariables: [],
    storedDefinitions: [],
  };
  data.arrayed = data.arrayed.filter (
    v => v != '' && v != undefined && v != null
  ); //Remove undeifned, empty strings and null from the input array
  //console.log (data.arrayed);
  const getKeyWord = i => {
    return data.arrayed[i];
  };
  const error = message => {
    if(data.errorsOnPlayground) data.output += `\n/* ${message}*/\n`;
    console.error (`Carbonara Error =>\n ${message}`);
  };
  const isWhat = text => {
    if (text == undefined) return false;
    let _is;
    for (var i = 0; i < data.storedFunctions.length; i++) {
      if (data.storedFunctions[i] == text) _is = 'function';
    }
    if (_is != undefined) return _is;
    for (var i = 0; i < data.storedVariables.length; i++) {
      if (data.storedVariables[i].name == text) _is = 'variable';
    }
    if (_is != undefined) return _is;
    for (var i = 0; i < data.storedDefinitions.length; i++) {
      if (data.storedDefinitions[i].name == text) _is = 'definition';
    }
    return _is;
  };
  const getVariable = text => {
    let varObj;
    for (var i = 0; i < data.storedVariables.length; i++) {
      if (data.storedVariables[i].name == text)
        varObj = data.storedVariables[i];
    }
    return varObj;
  };
  const getVariableValueType = value => {
    if(typeof value =="object" || value =="null") return null
    if(value =="undefined" ) return undefined;
    if(isNaN(Number (value))==false) return "number";
    if(value === "true" || value === "false" ) return "boolean";
    return "string";
  }
  const output = _compression => {
    let openBrackets = 1;
    for (let i = 0; i < data.arrayed.length; i++) {
      data.current_keyword = getKeyWord (i);
      switch (data.current_keyword) {
        case 'define':
        case 'var':
        case 'let':
        case 'const':
          if (
            (getKeyWord (i + 2) == '=' && data.current_keyword == 'final') ||
            (data.current_keyword != 'final' &&
              data.current_keyword != 'define')
          ) {
            if(getKeyWord(i+3) =="("){
              data.storedVariables.push ({
                name: getKeyWord (i + 1),
                type: data.current_keyword,
                valueType: undefined,
                value: "`"+getKeyWord (i + 4)+"`"
              });
              data.output += `${'   '.repeat (openBrackets)} ${data.current_keyword} ${getKeyWord (i + 1)} = ${"`"+getKeyWord (i + 4)+"`"}; ${data.compression == true ? '' : '\n'}`;
              i += getKeyWord (i + 4)!="<"? 2:5;
            }else{
              data.storedVariables.push ({
                name: getKeyWord (i + 1),
                type: data.current_keyword,
                valueType: getKeyWord (i + 4)=="<"?getKeyWord (i + 5)=="value"?getVariableValueType(getKeyWord (i + 3)):getKeyWord (i + 5):undefined,
                value: getKeyWord (i + 3)
              });
              data.output += `${'   '.repeat (openBrackets)} ${data.current_keyword} ${getKeyWord (i + 1)} = ${getKeyWord (i + 3)}; ${data.compression == true ? '' : '\n'}`;
              i += getKeyWord (i + 4)!="<"? 2:5;
            }
          } 
          if (data.current_keyword == 'define' && getKeyWord (i + 2) == '=') {
            if(getKeyWord (i + 3) != '<' && getKeyWord (i + 5) != '>'){
                 error (
                    `Expected " < " and " > " on defining " ${getKeyWord(i+1)} " \n Example: ${data.current_keyword} Example : < /*Hello*/>`
                );
             }
            data.storedDefinitions.push ({
              name: getKeyWord (i + 1),
              value: getKeyWord (i + 4),
            });
            i += 3;
          } else if(data.current_variable=="define"){
            error (
              `Expected " : " on defining " ${getKeyWord(i+1)} " \n Example: ${data.current_keyword} ${getKeyWord(i+1)} : "Text"`
            );
          }
          break;
        case 'function':
          const name = getKeyWord (i + 1);
          data.storedFunctions.push (name);
          data.output += `${'   '.repeat (openBrackets)} let ${name} = ( ${getKeyWord (i + 3)} ) => { ${data.compression == true ? '' : '\n'}`;
          i += 4;
          openBrackets++;
          break;
        case 'if':
          data.output += `${'   '.repeat (openBrackets)} if(${getKeyWord (i + 2)}){\n`;
          i += 3;
          openBrackets++;
          break;
        case '$':
          if (isWhat (getKeyWord (i + 1)) == 'definition') {
            for (var a = 0; a < data.storedDefinitions.length; a++) {
              if (data.storedDefinitions[a].name == getKeyWord (i + 1)) {
                data.output += `${'   '.repeat (openBrackets)}${data.storedDefinitions[a].value}\n`;
              }
            }
          }
          break;
        case '}':
          data.output += `${'   '.repeat (openBrackets)}} ${data.compression == true ? '' : '\n'}`;
          openBrackets--;
          break;
        case '%%':
          data.output += getKeyWord (i + 1) + '\n';
          i += 2;
          break;
        case 'print':
          data.output += `${'   '.repeat (openBrackets)} console.log(${getKeyWord (i + 1)}); ${data.compression == true ? '' : '\n'}`;
          i++;
          break;
        default:
          if (isWhat (data.current_keyword) == 'function') {
            data.output += `${'   '.repeat (openBrackets)} ${data.current_keyword}(${getKeyWord (i + 2)}); ${data.compression == true ? '' : '\n'}`;
            i += 3;
          }
          if (isWhat (data.current_keyword) == 'variable') {
            //Redefine the value of the variable
            if (getKeyWord (i + 1) == '=') {
              const current_variable =  getVariable (data.current_keyword);
              if (current_variable.type == 'const') {
                error (
                  `You cannot modify the value of ${getKeyWord (i)}, once it's defined.`
                );
              }else {
                const current_type = getVariableValueType(getKeyWord (i + 2) );
                if(current_variable.valueType == current_type || current_variable.valueType == undefined){
                  data.output += `${'   '.repeat (openBrackets)} ${data.current_keyword} = ${getKeyWord (i + 2)}; ${data.compression == true ? '' : '\n'}`;
                }else{
                  error(`Expected <${current_variable.valueType}> as a value type, but found <${current_type}> while modifying value on <${data.current_keyword}>.`)
                }
              }
            }else{
              error (
                `Expected "=" at redefining ${getKeyWord (i)}.`
              );
            }
          }
      }
    }
    openBrackets = data.compression == true ? 1 : openBrackets;
    if (input.consoleOutput === true) {
      console.log (`\n   <-- Code Output --> \n\n ${data.output} `);
    }
    if (openBrackets > 1) {
      error ('Expected }.');
    }
    if (openBrackets < 1) {
      error ('Found too many }. ');
    }
    if (input.execute) eval (data.output);
    return data.output;
  };
  return output ();
}
}




