const FIELDS = new Map([
  ['d', {flags: ['-','+',' ',    '0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['i', {flags: ['-','+',' ',    '0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['u', {flags: ['-','+',' ',    '0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['o', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['b', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['x', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['X', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['n', {flags: ['-','+',' ',       ], precision: false, lenght_modifier: ['hh','h','l','ll','j','z','t','wN','wF'                 ]}],
  ['a', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['A', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['f', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['F', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['e', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['E', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['g', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['G', {flags: ['-','+',' ','#','0'], precision: true , lenght_modifier: [         'l'                           ,'L','H','D','DD']}],
  ['c', {flags: ['-','+',' ',    '0'], precision: false, lenght_modifier: [         'l'                                            ]}],
  ['s', {flags: ['-','+',' ',    '0'], precision: true , lenght_modifier: [         'l'                                            ]}],
  ['p', {flags: ['-','+',' ',       ], precision: false, lenght_modifier: [                                                        ]}],
]);

// TODO
// Replace wN with $._wN
// Replace wfN with $._wfN

const immd = (x) => token.immediate(x);

function genConversionSpecifier(specifier) {
  const e = FIELDS.get(specifier)

  const precision = (
    e.precision ?
    optional(seq(
      token.immediate('.'),
      field('precision', token.immediate(/\d+/))
    ))
    :
    seq()
  );

  return seq(
    '%',
    repeat(field('flag',choice(
      ...e.flags.map(token.immediate)
    ))),
    optional(field('width',
      token.immediate(/\d+/)
    )),
    precision,
    optional(field('modifier',choice(
      ...e.lenght_modifier.map(token.immediate)
    ))),
    field('specifier',token.immediate(specifier)),
  );
}

module.exports = grammar({
  name: 'printf',

  extras: $ => [
    /\n/ // for test
  ],

  conflicts: $ => [
    [$.integer],
    [$.integer, $.float, $.char, $.string],
    [$.integer, $.float, $.char, $.string, $.pointer, $.length],
  ],

  rules: {

    fstring: $ => repeat($._string),

    _string: $ => seq(
      optional($._encoding_prefix),
      '"',
      repeat($._s_char),
      '"',
    ),

    _encoding_prefix: $ => field(
      'encoding',
      choice(
        'u8', // UTF-8 string literal
        'L',  //  wide string literal
        'u',  //  wide string literal
        'U',  //  wide string literal
      )
    ),

    _s_char: $ => choice(
      $._escape_sequence,
      $._conversion_spec,
      /[^"%\\]+/
    ),

    _escape_sequence: $ => choice(
      $.simple_escape,
      $.octal_escape,
      $.hexadecimal_escape,
      $.universal_char,
    ),

    simple_escape: $ => choice(
      // Quoting
      seq(field('prefix','\\'), immd("'")),
      seq(field('prefix','\\'), immd('"')),
      seq(field('prefix','\\'), immd('?')),
      seq(field('prefix','\\'), immd('\\')),
      // Unicode Control Code Point
      seq(field('prefix','\\'), immd('a')),
      seq(field('prefix','\\'), immd('b')),
      seq(field('prefix','\\'), immd('f')),
      seq(field('prefix','\\'), immd('n')),
      seq(field('prefix','\\'), immd('r')),
      seq(field('prefix','\\'), immd('t')),
      seq(field('prefix','\\'), immd('v')),
    ),

    octal_escape: $ => seq(
      field('prefix','\\'),
      field('digits',immd(/[0-9]{1,3}/)),
    ),

    // TODO: error recovery
    hexadecimal_escape: $ => seq(
      field('prefix','\\x'),
      field('digits',immd(repeat1(/[0-9a-fA-F]+/))),
    ),

    _hexadecimal_digits: $ => field('digits',immd(repeat1(/[0-9a-fA-F]/))),

    // TODO: error recovery
    universal_char: $ => choice(
      seq(field('prefix','\\u'), field('digits',/[0-9a-fA-F]{4}/)),
      seq(field('prefix','\\U'), field('digits',/[0-9a-fA-F]{8}/)),
    ),

    _conversion_spec: $ => choice(
      $.integer,
      $.float,
      $.char,
      $.string,
      $.pointer,
      $.length,
    ),

    integer: $ => choice(
      genConversionSpecifier('d'),
      genConversionSpecifier('i'),
      genConversionSpecifier('b'),
      genConversionSpecifier('u'),
      genConversionSpecifier('o'),
      genConversionSpecifier('x'),
      genConversionSpecifier('X'),
    ),

    float: $ => choice(
      genConversionSpecifier('f'),
      genConversionSpecifier('F'),
      genConversionSpecifier('e'),
      genConversionSpecifier('E'),
      genConversionSpecifier('g'),
      genConversionSpecifier('G'),
      genConversionSpecifier('a'),
      genConversionSpecifier('A'),
    ),

    char: $ => choice(
      genConversionSpecifier('c'),
    ),

    string: $ => choice(
      genConversionSpecifier('s'),
    ),

    pointer: $ => choice(
      genConversionSpecifier('p'),
    ),

    length: $ => choice(
      genConversionSpecifier('n'),
    ),

  },

});
