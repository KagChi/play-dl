import { URL } from 'url'
import { request } from './request'
import querystring from 'querystring'

interface formatOptions {
  url? : string;
  sp? : string;
  signatureCipher? : string;
  cipher?: string;
  s? : string;
}
const var_js = '[a-zA-Z_\\$][a-zA-Z_0-9]*';
const singlequote_js = `'[^'\\\\]*(:?\\\\[\\s\\S][^'\\\\]*)*'`;
const duoblequote_js = `"[^"\\\\]*(:?\\\\[\\s\\S][^"\\\\]*)*"`;
const quote_js = `(?:${singlequote_js}|${duoblequote_js})`;
const key_js = `(?:${var_js}|${quote_js})`;
const prop_js = `(?:\\.${var_js}|\\[${quote_js}\\])`;
const empty_js = `(?:''|"")`;
const reverse_function = ':function\\(a\\)\\{' +
'(?:return )?a\\.reverse\\(\\)' +
'\\}';
const slice_function = ':function\\(a,b\\)\\{' +
'return a\\.slice\\(b\\)' +
'\\}';
const splice_function = ':function\\(a,b\\)\\{' +
'a\\.splice\\(0,b\\)' +
'\\}';
const swap_function = ':function\\(a,b\\)\\{' +
'var c=a\\[0\\];a\\[0\\]=a\\[b(?:%a\\.length)?\\];a\\[b(?:%a\\.length)?\\]=c(?:;return a)?' +
'\\}';
const obj_regexp = new RegExp(
  `var (${var_js})=\\{((?:(?:${
    key_js}${reverse_function}|${
    key_js}${slice_function}|${
    key_js}${splice_function}|${
    key_js}${swap_function
  }),?\\r?\\n?)+)\\};`)
const function_regexp = new RegExp(`${`function(?: ${var_js})?\\(a\\)\\{` +
`a=a\\.split\\(${empty_js}\\);\\s*` +
`((?:(?:a=)?${var_js}`}${
prop_js
}\\(a,\\d+\\);)+)` +
`return a\\.join\\(${empty_js}\\)` +
`\\}`);
const reverse_regexp = new RegExp(`(?:^|,)(${key_js})${reverse_function}`, 'm');
const slice_regexp = new RegExp(`(?:^|,)(${key_js})${slice_function}`, 'm');
const splice_regexp = new RegExp(`(?:^|,)(${key_js})${splice_function}`, 'm');
const swap_regexp = new RegExp(`(?:^|,)(${key_js})${swap_function}`, 'm');

export function js_tokens( body:string ) {
  let function_action = function_regexp.exec(body)
  let object_action = obj_regexp.exec(body)
  if(!function_action || !object_action) return null

  let object = object_action[1].replace(/\$/g, '\\$')
  let object_body = object_action[2].replace(/\$/g, '\\$')
  let function_body = function_action[1].replace(/\$/g, '\\$')

  let result = reverse_regexp.exec(object_body);
  const reverseKey = result && result[1]
  .replace(/\$/g, '\\$')
  .replace(/\$|^'|^"|'$|"$/g, '');
  
  result = slice_regexp.exec(object_body)
  const sliceKey = result && result[1]
  .replace(/\$/g, '\\$')
  .replace(/\$|^'|^"|'$|"$/g, '');

  result = splice_regexp.exec(object_body);
  const spliceKey = result && result[1]
  .replace(/\$/g, '\\$')
  .replace(/\$|^'|^"|'$|"$/g, '');

  result = swap_regexp.exec(object_body);
  const swapKey = result && result[1]
  .replace(/\$/g, '\\$')
  .replace(/\$|^'|^"|'$|"$/g, '');

  const keys = `(${[reverseKey, sliceKey, spliceKey, swapKey].join('|')})`;
  const myreg = `(?:a=)?${object
  }(?:\\.${keys}|\\['${keys}'\\]|\\["${keys}"\\])` +
    `\\(a,(\\d+)\\)`;
  const tokenizeRegexp = new RegExp(myreg, 'g');
  const tokens = [];
  while((result = tokenizeRegexp.exec(function_body)) !== null){
    let key = result[1] || result[2] || result[3];
    switch (key) {
      case swapKey:
        tokens.push(`sw${result[4]}`);
        break;
      case reverseKey:
        tokens.push('rv');
        break;
      case sliceKey:
        tokens.push(`sl${result[4]}`);
        break;
      case spliceKey:
        tokens.push(`sp${result[4]}`);
        break;
    }
  }
  return tokens
}

function deciper_signature(tokens : string[], signature :string){
  let sig = signature.split('')
  let len = tokens.length
  for(let i = 0; i < len; i++ ){
    let token = tokens[i], pos;
    switch(token.slice(0,2)){
      case 'sw':
        pos = parseInt(token.slice(2))
        sig = swappositions(sig, pos)
        break
      case 'rv':
        sig = sig.reverse()
        break
      case 'sl':
        pos = parseInt(token.slice(2))
        sig = sig.slice(pos)
        break
      case 'sp':
        pos = parseInt(token.slice(2))
        sig.splice(0, pos)
        break
    }
  }
  return sig.join('')
}


function swappositions(array : string[], position : number){
  let first = array[0]
  array[0] = array[position]
  array[position] = first
  return array
}

function download_url(format: formatOptions, sig : string){
  let decoded_url;
  if(!format.url) return;
  decoded_url = format.url

  decoded_url = decodeURIComponent(decoded_url)

  let parsed_url = new URL(decoded_url)
  parsed_url.searchParams.set('ratebypass', 'yes');

  if(sig){
    parsed_url.searchParams.set(format.sp || 'signature', sig)
  }
  format.url = parsed_url.toString();
}

export async function format_decipher(formats: formatOptions[], html5player : string){
  let body = await request(html5player)
  let tokens = js_tokens(body)
  formats.forEach((format) => {
    let cipher = format.signatureCipher || format.cipher;
    if(cipher){
      Object.assign(format, querystring.parse(cipher))
      delete format.signatureCipher;
      delete format.cipher;
    }
    let sig;
    if(tokens && format.s){
      sig = deciper_signature(tokens, format.s)
      download_url(format, sig)
      delete format.s
      delete format.sp
    }
  });
  return formats
}