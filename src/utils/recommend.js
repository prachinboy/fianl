// recommend_hybrid.js
// ✅ ระบบ Hybrid Recommendation: Content-Based + Association Rule (จาก Firestore logs)

export function recommendMenus(user, recipes, logs = []) {
  const scores = []

  for (const recipe of recipes) {
    let score = 0

    if (user.disliked_dishes.includes(recipe.name)) continue

    // Content-Based Scoring
    if (recipe.ingredients.some(i => user.preferred_meats.includes(i))) score += 1
    if (recipe.ingredients.some(i => user.preferred_veggies.includes(i))) score += 1
    if (user.preferred_methods.includes(recipe.method)) score += 1
    if (user.preferred_spices?.some(s => recipe.ingredients.includes(s))) score += 0.5
    if (user.liked_dishes.includes(recipe.name)) score += 2

    // Association Rule Boost
    const appeared = logs.some(log => {
      const liked = log.userProfile?.liked_dishes || []
      const recommended = log.resultData?.map(r => r.name) || []
      return liked.some(l => user.liked_dishes.includes(l)) &&
             recommended.includes(recipe.name)
    })

    if (appeared) score += 2.5 // เสริมคะแนนจากกฎจริง

    scores.push({ ...recipe, score })
  }

  return scores.sort((a, b) => b.score - a.score)
}