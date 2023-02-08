class A {
  $t () {}

  $gt () {}

  $i18n () {}

  g () {
    const y = 'acmer';
    console.log(this.$t(y));
    console.log(this.$i18n());
    console.log(this.$gt(y));
  }

  f () {
    const x = 'hans';
    console.log(this.$i18n());
    console.log(this.$t(x));
    console.log(this.$gt(x));
  }
}
const a = new A();
a.f();
a.g();
