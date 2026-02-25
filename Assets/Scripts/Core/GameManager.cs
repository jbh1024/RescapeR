using System;
using System.IO;
using RescapeR.Data;
using UnityEngine;

namespace RescapeR.Core
{
    public enum GameFlowState
    {
        Boot,
        Playing,
        Result
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Runtime")]
        [SerializeField] private GameFlowState flowState = GameFlowState.Boot;
        [SerializeField] private bool autoRestartAfterResult = true;
        [SerializeField] private float autoRestartDelaySeconds = 3f;
        [SerializeField] private float runStartTime;
        [SerializeField] private float resultShownAt = -1f;
        [SerializeField] private GameSaveData saveData;
        [SerializeField] private int lastSavedRunSeconds;

        public event Action<FloorId> OnFloorChanged;
        public event Action<ResultGrade, int, int> OnRunEnded;

        public GameFlowState FlowState => flowState;
        public FloorId CurrentFloor => saveData.player.currentFloor;
        public int CurrentHP => saveData.player.hp;
        public int CurrentGold => saveData.player.gold;
        public int TotalRunSeconds => Mathf.Max(0, Mathf.RoundToInt(Time.realtimeSinceStartup - runStartTime));

        private string SavePath => Path.Combine(Application.persistentDataPath, "save.json");

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            LoadOrCreateSave();
            StartRunFromSave();
        }

        private void Update()
        {
            if (!autoRestartAfterResult || flowState != GameFlowState.Result || resultShownAt < 0f)
            {
                return;
            }

            if (Time.realtimeSinceStartup >= resultShownAt + Mathf.Max(0f, autoRestartDelaySeconds))
            {
                StartNewRun();
            }
        }

        public void StartNewRun()
        {
            saveData.player.currentFloor = FloorId.B6;
            saveData.player.hp = 100;
            saveData.player.gold = 0;
            saveData.player.inventory.Clear();
            runStartTime = Time.realtimeSinceStartup;
            lastSavedRunSeconds = 0;
            resultShownAt = -1f;
            flowState = GameFlowState.Playing;
            SaveGame();
            OnFloorChanged?.Invoke(saveData.player.currentFloor);
        }

        public void MarkPlayerDeath()
        {
            saveData.meta.deathCount += 1;
            SaveGame();
        }

        public void AddGold(int amount)
        {
            saveData.player.gold += Mathf.Max(0, amount);
        }

        public void ApplyDamage(int amount)
        {
            saveData.player.hp = Mathf.Max(0, saveData.player.hp - Mathf.Max(0, amount));
            if (saveData.player.hp == 0)
            {
                MarkPlayerDeath();
                EndRunAndLoop();
            }
        }

        public void AddToInventory(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return;
            }

            saveData.player.inventory.Add(itemId);
        }

        public void UnlockItem(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return;
            }

            if (!saveData.meta.unlockedItems.Contains(itemId))
            {
                saveData.meta.unlockedItems.Add(itemId);
            }
        }

        public void MoveToNextFloor()
        {
            if (flowState != GameFlowState.Playing)
            {
                return;
            }

            if (CurrentFloor == FloorId.F10)
            {
                EndRunAndLoop();
                return;
            }

            saveData.player.currentFloor = CurrentFloor + 1;
            SaveGame();
            OnFloorChanged?.Invoke(saveData.player.currentFloor);
        }

        public void EnterEndingFloor()
        {
            if (CurrentFloor == FloorId.F9)
            {
                saveData.player.currentFloor = FloorId.F10;
                SaveGame();
                OnFloorChanged?.Invoke(saveData.player.currentFloor);
                EndRunAndLoop();
            }
        }

        public void SaveGame()
        {
            var delta = Mathf.Max(0, TotalRunSeconds - lastSavedRunSeconds);
            saveData.meta.totalPlayTime += delta;
            lastSavedRunSeconds = TotalRunSeconds;
            var json = JsonUtility.ToJson(saveData, true);
            File.WriteAllText(SavePath, json);
        }

        public void EndRunAndLoop()
        {
            flowState = GameFlowState.Result;
            var totalSeconds = TotalRunSeconds;
            var grade = ResultGradeCalculator.Evaluate(totalSeconds);
            OnRunEnded?.Invoke(grade, totalSeconds, saveData.meta.deathCount);
            resultShownAt = Time.realtimeSinceStartup;
        }

        private void LoadOrCreateSave()
        {
            if (File.Exists(SavePath))
            {
                var json = File.ReadAllText(SavePath);
                saveData = JsonUtility.FromJson<GameSaveData>(json);
                if (saveData == null)
                {
                    saveData = GameSaveData.CreateDefault();
                }
            }
            else
            {
                saveData = GameSaveData.CreateDefault();
                SaveGame();
            }
        }

        private void StartRunFromSave()
        {
            flowState = GameFlowState.Playing;
            runStartTime = Time.realtimeSinceStartup;
            lastSavedRunSeconds = 0;
            resultShownAt = -1f;
            OnFloorChanged?.Invoke(saveData.player.currentFloor);
        }
    }
}
