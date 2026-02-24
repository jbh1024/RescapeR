using System.Collections.Generic;
using RescapeR.Core;
using RescapeR.Data;
using UnityEngine;

namespace RescapeR.Gameplay
{
    public class LevelManager : MonoBehaviour
    {
        [SerializeField] private List<LevelThemeSO> themes = new List<LevelThemeSO>();
        [SerializeField] private Transform[] mobSpawnPoints;
        [SerializeField] private Transform midBossSpawnPoint;

        private readonly Dictionary<FloorId, LevelThemeSO> themeMap = new Dictionary<FloorId, LevelThemeSO>();
        private readonly List<GameObject> spawnedEnemies = new List<GameObject>();

        private void Awake()
        {
            foreach (var theme in themes)
            {
                if (theme == null)
                {
                    continue;
                }

                themeMap[theme.floor] = theme;
            }
        }

        private void OnEnable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnFloorChanged += HandleFloorChanged;
            }
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnFloorChanged -= HandleFloorChanged;
            }
        }

        public void FloorCleared()
        {
            GameManager.Instance.MoveToNextFloor();
        }

        private void HandleFloorChanged(FloorId floor)
        {
            ClearSpawnedEnemies();
            if (!themeMap.TryGetValue(floor, out var theme))
            {
                Debug.LogWarning($"[LevelManager] Theme missing for floor: {floor}");
                return;
            }

            ApplyTheme(theme);
            SpawnEnemies(theme);
            Debug.Log($"[Elevator] {ElevatorDialogueProvider.GetRandomLine()}");
        }

        private void ApplyTheme(LevelThemeSO theme)
        {
            if (Camera.main != null && ColorUtility.TryParseHtmlString(theme.colorHex, out var color))
            {
                Camera.main.backgroundColor = color;
            }
        }

        private void SpawnEnemies(LevelThemeSO theme)
        {
            if (theme.midBossPrefab != null && midBossSpawnPoint != null)
            {
                spawnedEnemies.Add(Instantiate(theme.midBossPrefab, midBossSpawnPoint.position, Quaternion.identity));
            }

            foreach (var mob in theme.mobs)
            {
                if (mob.prefab == null || mobSpawnPoints == null || mobSpawnPoints.Length == 0)
                {
                    continue;
                }

                var spawnCount = Random.Range(mob.minCount, mob.maxCount + 1);
                for (var i = 0; i < spawnCount; i++)
                {
                    var spawnPoint = mobSpawnPoints[Random.Range(0, mobSpawnPoints.Length)];
                    spawnedEnemies.Add(Instantiate(mob.prefab, spawnPoint.position, Quaternion.identity));
                }
            }
        }

        private void ClearSpawnedEnemies()
        {
            foreach (var enemy in spawnedEnemies)
            {
                if (enemy != null)
                {
                    Destroy(enemy);
                }
            }

            spawnedEnemies.Clear();
        }
    }
}
