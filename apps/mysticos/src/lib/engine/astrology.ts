/**
 * 星座周期映射逻辑
 */
export function getAstrologyProfile(birthDate: string) {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const signs = [
    { name: "摩羯座", start: [12, 22], end: [1, 19] },
    { name: "水瓶座", start: [1, 20], end: [2, 18] },
    { name: "双鱼座", start: [2, 19], end: [3, 20] },
    { name: "白羊座", start: [3, 21], end: [4, 19] },
    { name: "金牛座", start: [4, 20], end: [5, 20] },
    { name: "双子座", start: [5, 21], end: [6, 21] },
    { name: "巨蟹座", start: [6, 22], end: [7, 22] },
    { name: "狮子座", start: [7, 23], end: [8, 22] },
    { name: "处女座", start: [8, 23], end: [9, 22] },
    { name: "天秤座", start: [9, 23], end: [10, 23] },
    { name: "天蝎座", start: [10, 24], end: [11, 22] },
    { name: "射手座", start: [11, 23], end: [12, 21] },
  ];

  const sign = signs.find(s => {
    const [sm, sd] = s.start;
    const [em, ed] = s.end;
    return (month === sm && day >= sd) || (month === em && day <= ed);
  }) || signs[0];

  return {
    sign: sign.name,
    element: ["白羊", "狮子", "射手"].some(s => sign.name.includes(s)) ? "fire" :
             ["金牛", "处女", "摩羯"].some(s => sign.name.includes(s)) ? "earth" :
             ["双子", "天秤", "水瓶"].some(s => sign.name.includes(s)) ? "air" : "water"
  };
}
