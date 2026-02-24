using System;
using UnityEngine;

namespace RescapeR.Data
{
    public enum WeaponTier
    {
        Common = 1,
        Rare = 2,
        Epic = 3,
        Legendary = 4
    }

    [Flags]
    public enum WeaponAffix
    {
        None = 0,
        Sticky = 1 << 0,
        Wireless = 1 << 1,
        Macro = 1 << 2
    }

    [CreateAssetMenu(fileName = "WeaponData_", menuName = "RescapeR/Weapon Data")]
    public class WeaponData : ScriptableObject
    {
        [Header("Identity")]
        public string weaponId;
        public string displayName;
        [TextArea] public string description;

        [Header("Classification")]
        public WeaponTier tier;
        public WeaponAffix affixes;

        [Header("Combat Stats")]
        public float baseDamage = 10f;
        public float attackSpeed = 1f;
        public float critChance = 0.05f;
        public float backstabMultiplier = 1f;
        public bool canThrow;
        public bool supportsAutoFire;
        public bool breaksSuperArmor;
        public bool rangedReturnAttack;
        public bool dualWieldMode;

        [Header("Feedback")]
        public string hitSfxLabel;
        public string specialEffectLabel;
    }
}
