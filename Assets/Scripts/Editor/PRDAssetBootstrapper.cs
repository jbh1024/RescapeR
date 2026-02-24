#if UNITY_EDITOR
using System.Collections.Generic;
using RescapeR.Data;
using UnityEditor;
using UnityEngine;

namespace RescapeR.Editor
{
    public static class PRDAssetBootstrapper
    {
        private const string WeaponRoot = "Assets/GameData/Weapons";
        private const string LevelThemeRoot = "Assets/GameData/LevelThemes";

        [MenuItem("RescapeR/Bootstrap/Create PRD Assets")]
        public static void CreatePRDAssets()
        {
            EnsureFolder("Assets/GameData");
            EnsureFolder(WeaponRoot);
            EnsureFolder(LevelThemeRoot);

            CreateWeapons();
            CreateLevelThemes();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[PRDAssetBootstrapper] PRD 기반 데이터 에셋 생성 완료");
        }

        private static void CreateWeapons()
        {
            var rows = new List<WeaponRow>
            {
                new WeaponRow("weapon_keyboard_membrane", "번들 멤브레인 (Basic Membrane)", "물컹거리는 타건감. 기본 지급품.", WeaponTier.Common, 10f, 1f, 0.05f, 1f, "틱틱", ""),
                new WeaponRow("weapon_keyboard_dusty", "비품실 굴러다니던 키보드 (Dusty Spare)", "먼지가 풀풀 날린다.", WeaponTier.Common, 12f, 0.95f, 0.05f, 1f, "퍽퍽", "먼지 이펙트"),
                new WeaponRow("weapon_keyboard_blue", "PC방 에디션 청축 (Blue Switch)", "시끄러워서 동료들이 싫어한다.", WeaponTier.Rare, 13f, 1.1f, 0.20f, 1f, "찰칵찰칵", "[소음공해] 치명타 확률 증가"),
                new WeaponRow("weapon_keyboard_red", "저소음 적축 (Silent Red)", "몰래 딴짓하기 좋다.", WeaponTier.Rare, 12f, 1.2f, 0.05f, 1.5f, "서걱서걱", "[암살] 후방 공격 데미지 150%"),
                new WeaponRow("weapon_keyboard_rgb", "RGB 게이밍 (RGB Gaming)", "눈이 부시게 화려하다.", WeaponTier.Epic, 16f, 1.1f, 0.10f, 1f, "타닥타닥", "[LED 잔상] 속성 장판"),
                new WeaponRow("weapon_keyboard_aluminum", "풀 알루미늄 커스텀 (Full Aluminum)", "이건 무기가 아니라 흉기다.", WeaponTier.Epic, 22f, 0.75f, 0.08f, 1f, "도각도각", "[통울림] 슈퍼아머 파괴"),
                new WeaponRow("weapon_keyboard_capacitive", "무접점 끝판왕 (Godly Capacitive)", "구름을 누르는 기분.", WeaponTier.Legendary, 20f, 1.15f, 0.12f, 1f, "휙", "[염동력] 원거리 왕복 공격"),
                new WeaponRow("weapon_keyboard_split", "인체공학 스플릿 (Ergo Split)", "좌우 분리형으로 쌍검처럼 휘두른다.", WeaponTier.Legendary, 14f, 2.0f, 0.1f, 1f, "촤촤", "[이도류] 공속 2배")
            };

            foreach (var row in rows)
            {
                var path = $"{WeaponRoot}/{row.Id}.asset";
                var asset = AssetDatabase.LoadAssetAtPath<WeaponData>(path);
                if (asset == null)
                {
                    asset = ScriptableObject.CreateInstance<WeaponData>();
                    AssetDatabase.CreateAsset(asset, path);
                }

                asset.weaponId = row.Id;
                asset.displayName = row.Name;
                asset.description = row.Description;
                asset.tier = row.Tier;
                asset.baseDamage = row.Damage;
                asset.attackSpeed = row.AttackSpeed;
                asset.critChance = row.CritChance;
                asset.backstabMultiplier = row.BackstabMultiplier;
                asset.hitSfxLabel = row.HitSfx;
                asset.specialEffectLabel = row.SpecialEffect;
                asset.breaksSuperArmor = row.Id == "weapon_keyboard_aluminum";
                asset.rangedReturnAttack = row.Id == "weapon_keyboard_capacitive";
                asset.dualWieldMode = row.Id == "weapon_keyboard_split";
                asset.supportsAutoFire = (asset.affixes & WeaponAffix.Macro) != 0;

                EditorUtility.SetDirty(asset);
            }
        }

        private static void CreateLevelThemes()
        {
            var rows = new List<ThemeRow>
            {
                new ThemeRow(FloorId.B6, "심연 (Parking)", "#2C3E50", "어두운 주차장, 매연", "주차관리 팀장"),
                new ThemeRow(FloorId.B5, "심연 (Parking)", "#2C3E50", "어두운 주차장, 매연", "주차관리 팀장"),
                new ThemeRow(FloorId.B4, "심연 (Parking)", "#2C3E50", "어두운 주차장, 매연", "주차관리 팀장"),
                new ThemeRow(FloorId.B3, "심연 (Parking)", "#2C3E50", "어두운 주차장, 매연", "주차관리 팀장"),
                new ThemeRow(FloorId.B2, "심연 (Parking)", "#2C3E50", "어두운 주차장, 매연", "주차관리 팀장"),
                new ThemeRow(FloorId.B1, "보급소 (Cafeteria)", "#E67E22", "Safe Zone, 상점", "앵그리 셰프"),
                new ThemeRow(FloorId.F1, "관문 (Lobby)", "#ECF0F1", "차가운 대리석, 보안 게이트", "보안실장"),
                new ThemeRow(FloorId.F2, "전시 (Showroom)", "#1ABC9C", "유리벽, 회의실", "PPT 빌런"),
                new ThemeRow(FloorId.F3, "전시 (Showroom)", "#1ABC9C", "유리벽, 회의실", "PPT 빌런"),
                new ThemeRow(FloorId.F4, "혼돈 (Mobile/UX)", "#9B59B6", "스마트폰 프레임, 팝톡", "가챠 중독자"),
                new ThemeRow(FloorId.F5, "서버 (Web/Cloud)", "#2ECC71", "전선 덩굴, 데이터 흐름", "풀스택 거미"),
                new ThemeRow(FloorId.F6, "글리치 (QA/AI)", "#E74C3C", "깨진 화면, 에러 코드", "버그 헌터"),
                new ThemeRow(FloorId.F7, "확산 (Marketing)", "#F1C40F", "네온 사인, 확성기", "바이럴 확성기"),
                new ThemeRow(FloorId.F8, "지원 (Support)", "#D35400", "낡은 서류, 전화벨 소리", "실적 압박맨"),
                new ThemeRow(FloorId.F9, "권력 (Executive)", "#8E44AD", "고급 카펫, 클래식 음악", "대표이사 (CEO)"),
                new ThemeRow(FloorId.F10, "옥상 (Ending)", "#8E44AD", "무한 루프의 시작점", "없음")
            };

            foreach (var row in rows)
            {
                var path = $"{LevelThemeRoot}/LevelTheme_{row.Floor}.asset";
                var asset = AssetDatabase.LoadAssetAtPath<LevelThemeSO>(path);
                if (asset == null)
                {
                    asset = ScriptableObject.CreateInstance<LevelThemeSO>();
                    AssetDatabase.CreateAsset(asset, path);
                }

                asset.floor = row.Floor;
                asset.zoneName = row.ZoneName;
                asset.colorHex = row.ColorHex;
                asset.themeDescription = row.Description;
                asset.midBossName = row.MidBossName;
                EditorUtility.SetDirty(asset);
            }
        }

        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path))
            {
                return;
            }

            var split = path.Split('/');
            var current = split[0];
            for (var i = 1; i < split.Length; i++)
            {
                var parent = current;
                current = $"{current}/{split[i]}";
                if (!AssetDatabase.IsValidFolder(current))
                {
                    AssetDatabase.CreateFolder(parent, split[i]);
                }
            }
        }

        private readonly struct WeaponRow
        {
            public WeaponRow(string id, string name, string description, WeaponTier tier, float damage, float attackSpeed, float critChance, float backstabMultiplier, string hitSfx, string specialEffect)
            {
                Id = id;
                Name = name;
                Description = description;
                Tier = tier;
                Damage = damage;
                AttackSpeed = attackSpeed;
                CritChance = critChance;
                BackstabMultiplier = backstabMultiplier;
                HitSfx = hitSfx;
                SpecialEffect = specialEffect;
            }

            public string Id { get; }
            public string Name { get; }
            public string Description { get; }
            public WeaponTier Tier { get; }
            public float Damage { get; }
            public float AttackSpeed { get; }
            public float CritChance { get; }
            public float BackstabMultiplier { get; }
            public string HitSfx { get; }
            public string SpecialEffect { get; }
        }

        private readonly struct ThemeRow
        {
            public ThemeRow(FloorId floor, string zoneName, string colorHex, string description, string midBossName)
            {
                Floor = floor;
                ZoneName = zoneName;
                ColorHex = colorHex;
                Description = description;
                MidBossName = midBossName;
            }

            public FloorId Floor { get; }
            public string ZoneName { get; }
            public string ColorHex { get; }
            public string Description { get; }
            public string MidBossName { get; }
        }
    }
}
#endif
