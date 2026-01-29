const gradientClasses = [
  "from-sky-500 via-blue-500 to-indigo-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-rose-500 via-pink-500 to-fuchsia-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-purple-500 via-violet-500 to-indigo-500",
  "from-lime-500 via-green-500 to-emerald-500"
];

export const getGradientClass = (hsCode: string) => {
  const digits = hsCode.replace(/\D/g, "");
  if (!digits) return gradientClasses[0];
  const sum = digits.split("").reduce((acc, d) => acc + Number(d), 0);
  const idx = sum % gradientClasses.length;
  return gradientClasses[idx];
};
