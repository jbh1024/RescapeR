using RescapeR.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace RescapeR.UI
{
    public class HUDController : MonoBehaviour
    {
        [SerializeField] private Slider hpBar;
        [SerializeField] private TMP_Text floorText;
        [SerializeField] private TMP_Text timerText;
        [SerializeField] private TMP_Text goldText;

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

        private void Update()
        {
            if (GameManager.Instance == null)
            {
                return;
            }

            if (hpBar != null)
            {
                hpBar.value = GameManager.Instance.CurrentHP / 100f;
            }

            if (goldText != null)
            {
                goldText.text = $"야근수당: {GameManager.Instance.CurrentGold}";
            }

            if (timerText != null)
            {
                var t = GameManager.Instance.TotalRunSeconds;
                timerText.text = $"{t / 60:00}:{t % 60:00}";
            }
        }

        private void HandleFloorChanged(Data.FloorId floor)
        {
            if (floorText != null)
            {
                floorText.text = $"현재 층: {floor}";
            }
        }
    }
}
