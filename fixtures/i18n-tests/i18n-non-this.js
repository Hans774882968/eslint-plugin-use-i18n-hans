function f () {
  const $i18n = () => {};
  const $gt = () => {};
  const $t = () => {};
  console.log($gt());
  console.log($t());
  console.log($i18n());
  const x = '1234';
  console.log($gt(x));
  console.log($t(x));
  console.log($i18n(x));

  console.log($gt('5678'));
  console.log($t('5678'));
  console.log($i18n('5678'));

  console.log($gt(1234));
  console.log($t(1234));
  console.log($i18n(1234));

  console.log($gt(null));
  console.log($t(null));
  console.log($i18n(null));

  console.log($gt(12 + 34));
  console.log($t(12 + 34));
  console.log($i18n(12 + 34));
}

f();
