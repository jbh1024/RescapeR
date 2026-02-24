using System;
using System.Collections.Generic;
using UnityEngine;

namespace RescapeR.Data
{
    [Serializable]
    public class PlayerSaveData
    {
        public FloorId currentFloor = FloorId.B6;
        public int hp = 100;
        public int gold;
        public List<string> inventory = new List<string>();
    }

    [Serializable]
    public class MetaSaveData
    {
        public int totalPlayTime;
        public int deathCount;
        public List<string> unlockedItems = new List<string>();
    }

    [Serializable]
    public class GameSaveData
    {
        public PlayerSaveData player = new PlayerSaveData();
        public MetaSaveData meta = new MetaSaveData();

        public static GameSaveData CreateDefault()
        {
            return new GameSaveData();
        }
    }
}
