import { run_test } from '../test-harness';

run_test([
  'bake=0',
  '',

  'factor((x+1)*(x+2)*(x+3),x)',
  '(1+x)*(2+x)*(3+x)',

  'factor((x+a)*(x^2+x+1),x)',
  '(1+x+x^2)*(a+x)',

  'factor(x*(x+1)*(x+2),x)',
  'x*(1+x)*(2+x)',

  'factor((x+1)*(x+2)*(y+3)*(y+4))',
  '(1+x)*(2+x)*(12+7*y+y^2)',

  'factor((x+1)*(x+2)*(y+3)*(y+4),x,y)',
  '(1+x)*(2+x)*(3+y)*(4+y)',

  'factor((-2*x+3)*(x+4),x)',
  '-(-3+2*x)*(4+x)',

  '(-2*x+3)*(x+4)+(-3+2*x)*(4+x)',
  '0',

  // make sure sign of remaining poly is factored

  'factor((x+1)*(-x^2+x+1),x)',
  '-(-1-x+x^2)*(1+x)',

  // sign handling

  //++++++

  'factor((x+1/2)*(+x+1/3)*(+x+1/4),x)',
  '1/24*(1+2*x)*(1+3*x)*(1+4*x)',

  '(x+1/2)*(+x+1/3)*(+x+1/4)-1/24*(1+2*x)*(1+3*x)*(1+4*x)',
  '0',

  //+++++-

  'factor((x+1/2)*(+x+1/3)*(+x-1/4),x)',
  '1/24*(-1+4*x)*(1+2*x)*(1+3*x)',

  '(x+1/2)*(+x+1/3)*(+x-1/4)-1/24*(-1+4*x)*(1+2*x)*(1+3*x)',
  '0',

  //++++-+

  'factor((x+1/2)*(+x+1/3)*(-x+1/4),x)',
  '-1/24*(-1+4*x)*(1+2*x)*(1+3*x)',

  '(x+1/2)*(+x+1/3)*(-x+1/4)+1/24*(-1+4*x)*(1+2*x)*(1+3*x)',
  '0',

  //++++--

  'factor((x+1/2)*(+x+1/3)*(-x-1/4),x)',
  '-1/24*(1+2*x)*(1+3*x)*(1+4*x)',

  '(x+1/2)*(+x+1/3)*(-x-1/4)+1/24*(1+2*x)*(1+3*x)*(1+4*x)',
  '0',

  //+++-++

  'factor((x+1/2)*(+x-1/3)*(+x+1/4),x)',
  '1/24*(-1+3*x)*(1+2*x)*(1+4*x)',

  '(x+1/2)*(+x-1/3)*(+x+1/4)-1/24*(-1+3*x)*(1+2*x)*(1+4*x)',
  '0',

  //+++-+-

  'factor((x+1/2)*(+x-1/3)*(+x-1/4),x)',
  '1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',

  '(x+1/2)*(+x-1/3)*(+x-1/4)-1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',
  '0',

  //+++--+

  'factor((x+1/2)*(+x-1/3)*(-x+1/4),x)',
  '-1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',

  '(x+1/2)*(+x-1/3)*(-x+1/4)+1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',
  '0',

  //+++---

  'factor((x+1/2)*(+x-1/3)*(-x-1/4),x)',
  '-1/24*(-1+3*x)*(1+2*x)*(1+4*x)',

  '(x+1/2)*(+x-1/3)*(-x-1/4)+1/24*(-1+3*x)*(1+2*x)*(1+4*x)',
  '0',

  //++-+++

  'factor((x+1/2)*(-x+1/3)*(+x+1/4),x)',
  '-1/24*(-1+3*x)*(1+2*x)*(1+4*x)',

  '(x+1/2)*(-x+1/3)*(+x+1/4)+1/24*(-1+3*x)*(1+2*x)*(1+4*x)',
  '0',

  //++-++-

  'factor((x+1/2)*(-x+1/3)*(+x-1/4),x)',
  '-1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',

  '(x+1/2)*(-x+1/3)*(+x-1/4)+1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',
  '0',

  //++-+-+

  'factor((x+1/2)*(-x+1/3)*(-x+1/4),x)',
  '1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',

  '(x+1/2)*(-x+1/3)*(-x+1/4)-1/24*(-1+3*x)*(-1+4*x)*(1+2*x)',
  '0',

  //++-+--

  'factor((x+1/2)*(-x+1/3)*(-x-1/4),x)',
  '1/24*(-1+3*x)*(1+2*x)*(1+4*x)',

  '(x+1/2)*(-x+1/3)*(-x-1/4)-1/24*(-1+3*x)*(1+2*x)*(1+4*x)',
  '0',

  //++--++

  'factor((x+1/2)*(-x-1/3)*(+x+1/4),x)',
  '-1/24*(1+2*x)*(1+3*x)*(1+4*x)',

  '(x+1/2)*(-x-1/3)*(+x+1/4)+1/24*(1+2*x)*(1+3*x)*(1+4*x)',
  '0',

  //++--+-

  'factor((x+1/2)*(-x-1/3)*(+x-1/4),x)',
  '-1/24*(-1+4*x)*(1+2*x)*(1+3*x)',

  '(x+1/2)*(-x-1/3)*(+x-1/4)+1/24*(-1+4*x)*(1+2*x)*(1+3*x)',
  '0',

  //++---+

  'factor((x+1/2)*(-x-1/3)*(-x+1/4),x)',
  '1/24*(-1+4*x)*(1+2*x)*(1+3*x)',

  '(x+1/2)*(-x-1/3)*(-x+1/4)-1/24*(-1+4*x)*(1+2*x)*(1+3*x)',
  '0',

  //++----

  'factor((x+1/2)*(-x-1/3)*(-x-1/4),x)',
  '1/24*(1+2*x)*(1+3*x)*(1+4*x)',

  '(x+1/2)*(-x-1/3)*(-x-1/4)-1/24*(1+2*x)*(1+3*x)*(1+4*x)',
  '0',

  //++++++

  'factor((+x+a)*(+x+b)*(+x+c),x)',
  '(a+x)*(b+x)*(c+x)',

  '(a+x)*(b+x)*(c+x)-(a+x)*(b+x)*(c+x)',
  '0',

  //+++++-

  'factor((+x+a)*(+x+b)*(+x-c),x)',
  '(a+x)*(b+x)*(-c+x)',

  '(+x+a)*(+x+b)*(+x-c)-(a+x)*(b+x)*(-c+x)',
  '0',

  //++++-+

  'factor((+x+a)*(+x+b)*(-x+c),x)',
  '-(a+x)*(b+x)*(-c+x)',

  '(+x+a)*(+x+b)*(-x+c)+(a+x)*(b+x)*(-c+x)',
  '0',

  //++++--

  'factor((+x+a)*(+x+b)*(-x-c),x)',
  '-(a+x)*(b+x)*(c+x)',

  '(+x+a)*(+x+b)*(-x-c)+(a+x)*(b+x)*(c+x)',
  '0',

  //++++

  'factor((+a*x+b)*(+c*x+d),x)',
  '(b+a*x)*(d+c*x)',

  '(+a*x+b)*(+c*x+d)-(b+a*x)*(d+c*x)',
  '0',

  //+++-

  'factor((+a*x+b)*(+c*x-d),x)',
  '(b+a*x)*(-d+c*x)',

  '(+a*x+b)*(+c*x-d)-(b+a*x)*(-d+c*x)',
  '0',

  //++-+

  'factor((+a*x+b)*(-c*x+d),x)',
  '-(b+a*x)*(-d+c*x)',

  '(+a*x+b)*(-c*x+d)+(b+a*x)*(-d+c*x)',
  '0',

  //++--

  'factor((+a*x+b)*(-c*x-d),x)',
  '-(b+a*x)*(d+c*x)',

  '(+a*x+b)*(-c*x-d)+(b+a*x)*(d+c*x)',
  '0',

  //+-++

  'factor((+a*x-b)*(+c*x+d),x)',
  '(d+c*x)*(-b+a*x)',

  '(+a*x-b)*(+c*x+d)-(d+c*x)*(-b+a*x)',
  '0',

  //+-+-

  'factor((+a*x-b)*(+c*x-d),x)',
  '(-b+a*x)*(-d+c*x)',

  '(+a*x-b)*(+c*x-d)-(-b+a*x)*(-d+c*x)',
  '0',

  //+--+

  'factor((+a*x-b)*(-c*x+d),x)',
  '-(-b+a*x)*(-d+c*x)',

  '(+a*x-b)*(-c*x+d)+(-b+a*x)*(-d+c*x)',
  '0',

  //+---

  'factor((+a*x-b)*(-c*x-d),x)',
  '-(d+c*x)*(-b+a*x)',

  '(+a*x-b)*(-c*x-d)+(d+c*x)*(-b+a*x)',
  '0',

  //-+++

  'factor((-a*x+b)*(+c*x+d),x)',
  '-(d+c*x)*(-b+a*x)',

  '(-a*x+b)*(+c*x+d)+(d+c*x)*(-b+a*x)',
  '0',

  //-++-

  'factor((-a*x+b)*(+c*x-d),x)',
  '-(-b+a*x)*(-d+c*x)',

  '(-a*x+b)*(+c*x-d)+(-b+a*x)*(-d+c*x)',
  '0',

  //-+-+

  'factor((-a*x+b)*(-c*x+d),x)',
  '(-b+a*x)*(-d+c*x)',

  '(-a*x+b)*(-c*x+d)-(-b+a*x)*(-d+c*x)',
  '0',

  //-+--

  'factor((-a*x+b)*(-c*x-d),x)',
  '(d+c*x)*(-b+a*x)',

  '(-a*x+b)*(-c*x-d)-(d+c*x)*(-b+a*x)',
  '0',

  //--++

  'factor((-a*x-b)*(+c*x+d),x)',
  '-(b+a*x)*(d+c*x)',

  '(-a*x-b)*(+c*x+d)+(b+a*x)*(d+c*x)',
  '0',

  //--+-

  'factor((-a*x-b)*(+c*x-d),x)',
  '-(b+a*x)*(-d+c*x)',

  '(-a*x-b)*(+c*x-d)+(b+a*x)*(-d+c*x)',
  '0',

  //---+

  'factor((-a*x-b)*(-c*x+d),x)',
  '(b+a*x)*(-d+c*x)',

  '(-a*x-b)*(-c*x+d)-(b+a*x)*(-d+c*x)',
  '0',

  //----

  'factor((-a*x-b)*(-c*x-d),x)',
  '(b+a*x)*(d+c*x)',

  '(-a*x-b)*(-c*x-d)-(b+a*x)*(d+c*x)',
  '0',

  // this used to cause divide by zero

  // fixed by calling ispolyexpandedform before calling coeff

  //  "factor(1/x+1)",
  //  "(1+x)/x",

  // see if poly gets rationalized

  //  "(x+1)(x+2)(x+3)/x^3",
  //  "1+6/(x^3)+11/(x^2)+6/x",

  //  "factor(last)",
  //  "(1+x)*(2+x)*(3+x)/(x^3)",

  // this used to fail

  'factor(x,x)',
  'x',

  'factor(x^2,x)',
  'x^2',

  'factor(x^3,x)',
  'x^3',

  'bake=1',
  '',

  'y=(x+1)*(x+2)',
  '',

  'factor(y,z)',
  'x^2+3*x+2',

  'factor(y,y)',
  'x^2+3*x+2',

  'y=x^2+exp(x)',
  '',

  'factor(y)',
  'x^2+exp(x)',
]);
