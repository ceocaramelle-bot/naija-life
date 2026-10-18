const HousingTiers = {
  FACE_ME_I_FACE_YOU: {
    title: "Face-Me-I-Face-You Room",
    rent: 15000,
    desc: "Rural single room with shared public toilet and water tap."
  },
  MIDDLE_CLASS: {
    title: "2-Bedroom Suburban Flat",
    rent: 120000,
    desc: "Self-contain apartment in a fenced compound with steady electricity."
  },
  LUXURY_ESTATE: {
    title: "Luxury Mansion (Gated Estate)",
    rent: 2500000,
    desc: "High-end mega house with private pool, garage, and gorgeous views."
  }
};

function openHousingMenu() {
  let choice = prompt(
    "Choose Accommodation to Rent:\n1. Face-Me-I-Face-You (₦15,000/mo)\n2. Suburban Flat (₦120,000/mo)\n3. Luxury Mansion (₦2,500,000/mo)\n\nEnter 1, 2, or 3:"
  );

  if (choice === "1") rentAccommodation(HousingTiers.FACE_ME_I_FACE_YOU);
  else if (choice === "2") rentAccommodation(HousingTiers.MIDDLE_CLASS);
  else if (choice === "3") rentAccommodation(HousingTiers.LUXURY_ESTATE);
}

function rentAccommodation(tier) {
  if (localPlayer.deductMoney(tier.rent)) {
    localPlayer.housing = tier.title;
    document.getElementById('housing-status').innerText = tier.title;
    localPlayer.addXP(100);
    alert(`Congratulations! You successfully rented: ${tier.title}`);
  }
}
