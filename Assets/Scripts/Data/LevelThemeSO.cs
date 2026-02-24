using System;
using System.Collections.Generic;
using UnityEngine;

namespace RescapeR.Data
{
    [Serializable]
    public class EnemyEntry
    {
        public string enemyName;
        public GameObject prefab;
        public int minCount = 1;
        public int maxCount = 3;
    }

    [CreateAssetMenu(fileName = "LevelTheme_", menuName = "RescapeR/Level Theme")]
    public class LevelThemeSO : ScriptableObject
    {
        [Header("Floor")]
        public FloorId floor;
        public string zoneName;
        public string colorHex;
        [TextArea] public string themeDescription;

        [Header("Enemy Setup")]
        public string midBossName;
        public GameObject midBossPrefab;
        public List<EnemyEntry> mobs = new List<EnemyEntry>();

        [Header("Presentation")]
        public AudioClip bgm;
    }
}
